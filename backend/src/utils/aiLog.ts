import { Prisma } from '@prisma/client';
import { prisma } from '../db/prisma';

export async function logAiRun(params: {
  agentName: string;
  inputJson: unknown;
  outputJson?: unknown;
  tokensUsed?: number;
  latencyMs?: number;
}) {
  return prisma.aiLog.create({
    data: {
      agentName: params.agentName,
      inputJson: params.inputJson as Prisma.InputJsonValue,
      outputJson:
        params.outputJson === undefined
          ? undefined
          : (params.outputJson as Prisma.InputJsonValue),
      tokensUsed: params.tokensUsed ?? 0,
      latencyMs: params.latencyMs ?? 0,
    },
  });
}
