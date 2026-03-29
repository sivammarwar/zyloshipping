import { Prisma } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { cache } from '../../lib/cache';

export type RevenuePeriod = 'day' | 'week' | 'month' | 'year';

const TRUNC: Record<RevenuePeriod, string> = {
  day: 'day',
  week: 'week',
  month: 'month',
  year: 'year',
};

export async function getRevenueTimeSeries(opts: {
  period: RevenuePeriod;
  startDate?: Date;
  endDate?: Date;
}) {
  const end = opts.endDate ?? new Date();
  const start = opts.startDate ?? new Date(end);
  if (!opts.startDate) {
    switch (opts.period) {
      case 'day':
        start.setUTCDate(end.getUTCDate() - 30);
        break;
      case 'week':
        start.setUTCDate(end.getUTCDate() - 84);
        break;
      case 'month':
        start.setUTCMonth(end.getUTCMonth() - 12);
        break;
      default:
        start.setUTCFullYear(end.getUTCFullYear() - 3);
    }
  }

  const tr = TRUNC[opts.period] ?? 'day';
  const trunc = Prisma.raw(`'${tr}'`);

  const revenueRows = await prisma.$queryRaw<{ label: Date; revenue: number; order_count: bigint }[]>`
    SELECT date_trunc(${trunc}, o.created_at)::date AS label,
      COALESCE(SUM(o.total_amount) FILTER (WHERE o.status NOT IN ('CANCELLED','REFUNDED')), 0)::float AS revenue,
      COUNT(*) FILTER (WHERE o.status NOT IN ('CANCELLED','REFUNDED'))::bigint AS order_count
    FROM orders o
    WHERE o.created_at >= ${start} AND o.created_at <= ${end}
    GROUP BY 1
    ORDER BY 1 ASC
  `;

  const commRows = await prisma.$queryRaw<{ label: Date; v: number }[]>`
    SELECT date_trunc(${trunc}, o.created_at)::date AS label,
      COALESCE(SUM(c.net_commission), 0)::float AS v
    FROM commissions c
    INNER JOIN orders o ON o.id = c.order_id
    WHERE o.created_at >= ${start} AND o.created_at <= ${end}
    GROUP BY 1
    ORDER BY 1 ASC
  `;

  const commMap = new Map(commRows.map(r => [r.label.toISOString().slice(0, 10), r.v]));

  return {
    labels: revenueRows.map(r => r.label.toISOString().slice(0, 10)),
    revenue: revenueRows.map(r => r.revenue),
    orders: revenueRows.map(r => Number(r.order_count)),
    commissions: revenueRows.map(
      r => commMap.get(r.label.toISOString().slice(0, 10)) ?? 0
    ),
  };
}

/**
 * Get today's revenue (cached for 5 minutes)
 */
export async function getTodayRevenue(): Promise<number> {
  return cache.getOrSet(
    'analytics:revenue:today',
    async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const result = await prisma.order.aggregate({
        where: {
          createdAt: { gte: today },
          status: { notIn: ['CANCELLED', 'REFUNDED'] },
        },
        _sum: { totalAmount: true },
      });

      return result._sum.totalAmount || 0;
    },
    300 // 5 minutes
  );
}

/**
 * Get this week's revenue (cached for 5 minutes)
 */
export async function getWeekRevenue(): Promise<number> {
  return cache.getOrSet(
    'analytics:revenue:week',
    async () => {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      weekStart.setHours(0, 0, 0, 0);

      const result = await prisma.order.aggregate({
        where: {
          createdAt: { gte: weekStart },
          status: { notIn: ['CANCELLED', 'REFUNDED'] },
        },
        _sum: { totalAmount: true },
      });

      return result._sum.totalAmount || 0;
    },
    300 // 5 minutes
  );
}

/**
 * Get this month's revenue (cached for 5 minutes)
 */
export async function getMonthRevenue(): Promise<number> {
  return cache.getOrSet(
    'analytics:revenue:month',
    async () => {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const result = await prisma.order.aggregate({
        where: {
          createdAt: { gte: monthStart },
          status: { notIn: ['CANCELLED', 'REFUNDED'] },
        },
        _sum: { totalAmount: true },
      });

      return result._sum.totalAmount || 0;
    },
    300 // 5 minutes
  );
}

/**
 * Invalidate revenue cache after new order
 * Call this after every confirmed payment
 */
export async function invalidateRevenueCache(): Promise<void> {
  await Promise.all([
    cache.del('analytics:revenue:today'),
    cache.del('analytics:revenue:week'),
    cache.del('analytics:revenue:month'),
  ]);
}
