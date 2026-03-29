import { Response } from 'express';
import { AgentStatus, Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../../db/prisma';
import { AuthRequest } from '../../middleware/auth.middleware';
import { redis, KEYS } from '../../utils/redis';
import { parsePagination } from '../../utils/pagination';
import { logAdminAction } from '../../services/admin/adminLog.service';

const EIGHT = ['content', 'curation', 'pricing', 'routing', 'support', 'refund', 'reviews', 'health'] as const;

const USD_PER_1K = Number(process.env.OPENAI_USD_PER_1K_TOKENS || '0.005');

function mapApiStatus(db: AgentStatus, disabledRedis: boolean): 'RUNNING' | 'IDLE' | 'ERROR' | 'DISABLED' {
  if (disabledRedis) return 'DISABLED';
  if (db === AgentStatus.RUNNING) return 'RUNNING';
  if (db === AgentStatus.ERROR) return 'ERROR';
  return 'IDLE';
}

export async function getAgentsStatus(_req: AuthRequest, res: Response) {
  try {
    const dayStart = new Date();
    dayStart.setUTCHours(0, 0, 0, 0);
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);

    const [states, totalsToday, totalsMonth] = await Promise.all([
      prisma.agentState.findMany(),
      prisma.aiLog.groupBy({
        by: ['agentName'],
        where: { createdAt: { gte: dayStart } },
        _sum: { tokensUsed: true },
        _count: { _all: true },
        _avg: { latencyMs: true },
      }),
      prisma.aiLog.aggregate({
        _sum: { tokensUsed: true },
        where: { createdAt: { gte: monthStart } },
      }),
    ]);

    const byName = new Map(states.map(s => [s.id, s]));
    const tokToday = new Map(totalsToday.map(t => [t.agentName, t]));

    let totalTokensToday = 0;
    let totalCostToday = 0;

    const agents = await Promise.all(
      EIGHT.map(async name => {
        const st = byName.get(name);
        const disabled = redis ? (await redis.get(KEYS.agentDisabled(name))) === '1' : false;

        const g = tokToday.get(name);
        const tokensUsedToday = Number(g?._sum.tokensUsed ?? 0);
        const costToday = (tokensUsedToday / 1000) * USD_PER_1K;
        totalTokensToday += tokensUsedToday;
        totalCostToday += costToday;

        const [successCount, errCount, recentLogs] = await Promise.all([
          prisma.aiLog.count({
            where: {
              agentName: name,
              createdAt: { gte: dayStart },
              NOT: { outputJson: { equals: Prisma.DbNull } },
            },
          }),
          prisma.aiLog.count({
            where: {
              agentName: name,
              createdAt: { gte: dayStart },
              outputJson: { equals: Prisma.DbNull },
            },
          }),
          prisma.aiLog.findMany({
            where: { agentName: name },
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
              id: true,
              inputJson: true,
              outputJson: true,
              tokensUsed: true,
              latencyMs: true,
              createdAt: true,
            },
          }),
        ]);

        const attempts = successCount + errCount;
        const successRate = attempts > 0 ? Math.round((successCount / attempts) * 10000) / 100 : (st?.successRate ?? 100);

        return {
          name,
          displayName: st?.name ?? name,
          status: mapApiStatus(st?.status ?? AgentStatus.IDLE, disabled),
          lastRun: st?.lastRunAt ?? null,
          lastRunDuration: Math.round(g?._avg.latencyMs ?? st?.avgLatencyMs ?? 0),
          tokensUsedToday,
          costToday: Math.round(costToday * 10000) / 10000,
          successRate,
          errorCount: errCount,
          recentLogs,
        };
      })
    );

    const totalCostThisMonth = ((Number(totalsMonth._sum.tokensUsed ?? 0)) / 1000) * USD_PER_1K;

    res.json({
      agents,
      totalTokensToday,
      totalCostToday: Math.round(totalCostToday * 10000) / 10000,
      totalCostThisMonth: Math.round(totalCostThisMonth * 10000) / 10000,
    });
  } catch (e) {
    console.error('[admin.agents.status]', e);
    res.status(500).json({ error: 'Failed to load agent status' });
  }
}

export async function getAgentLogs(req: AuthRequest, res: Response) {
  try {
    const name = req.params.name;
    const { page, limit, skip } = parsePagination(req, 30, 200);
    const from = req.query.from ? new Date(String(req.query.from)) : undefined;
    const to = req.query.to ? new Date(String(req.query.to)) : undefined;
    const status = typeof req.query.status === 'string' ? req.query.status : 'all';

    const createdAt: Prisma.DateTimeFilter = {};
    if (from && !Number.isNaN(from.getTime())) createdAt.gte = from;
    if (to && !Number.isNaN(to.getTime())) createdAt.lte = to;

    const where: Prisma.AiLogWhereInput = {
      agentName: name,
      ...(Object.keys(createdAt).length ? { createdAt } : {}),
    };

    if (status === 'success') {
      where.AND = [{ NOT: { outputJson: { equals: Prisma.DbNull } } }];
    } else if (status === 'error') {
      where.AND = [{ outputJson: { equals: Prisma.DbNull } }];
    }

    const [logs, total] = await Promise.all([
      prisma.aiLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.aiLog.count({ where }),
    ]);

    res.json({
      logs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (e) {
    console.error('[admin.agents.logs]', e);
    res.status(500).json({ error: 'Failed to load agent logs' });
  }
}

export async function postAgentToggle(req: AuthRequest, res: Response) {
  const schema = z.object({ enabled: z.boolean() });
  try {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'enabled boolean required' });
    }
    if (!redis) {
      return res.status(503).json({ error: 'Redis required for agent toggle' });
    }

    const name = req.params.name;
    if (!EIGHT.includes(name as (typeof EIGHT)[number])) {
      return res.status(400).json({ error: 'Unknown agent' });
    }

    if (parsed.data.enabled) {
      await redis.del(KEYS.agentDisabled(name));
    } else {
      await redis.set(KEYS.agentDisabled(name), '1');
    }

    await logAdminAction(req, {
      action: 'agent.toggle',
      resource: 'agent',
      resourceId: name,
      meta: { enabled: parsed.data.enabled },
    });

    res.json({ ok: true, agent: name, enabled: parsed.data.enabled });
  } catch (e) {
    console.error('[admin.agents.toggle]', e);
    res.status(500).json({ error: 'Failed to toggle agent' });
  }
}
