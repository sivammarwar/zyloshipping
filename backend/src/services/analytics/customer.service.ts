import { prisma } from '../../db/prisma';

export async function getCustomerAnalyticsBundle(opts: { periodStart?: Date; periodEnd?: Date } = {}) {
  const end = opts.periodEnd ?? new Date();
  const start = opts.periodStart ?? new Date(end.getTime() - 90 * 86400000);

  /** New = first order ever falls in window; returning = ordered in window but first order before window. */
  const newVsReturning = await prisma.$queryRaw<{ bucket: string; customers: bigint; orders: bigint; revenue: number }[]>`
    WITH first_order AS (
      SELECT user_id, MIN(created_at) AS first_at
      FROM orders
      GROUP BY user_id
    )
    SELECT
      CASE
        WHEN fo.first_at >= ${start} AND fo.first_at <= ${end} THEN 'new'
        ELSE 'returning'
      END AS bucket,
      COUNT(DISTINCT o.user_id)::bigint AS customers,
      COUNT(o.id)::bigint AS orders,
      COALESCE(SUM(o.total_amount) FILTER (WHERE o.status NOT IN ('CANCELLED', 'REFUNDED')), 0)::float AS revenue
    FROM orders o
    INNER JOIN first_order fo ON fo.user_id = o.user_id
    WHERE o.created_at >= ${start} AND o.created_at <= ${end}
    GROUP BY 1
    ORDER BY 1
  `;

  const clvRows = await prisma.$queryRaw<{ user_id: string; email: string; name: string | null; lifetime_value: number; order_count: bigint }[]>`
    SELECT u.id AS user_id, u.email, u.name,
      COALESCE(SUM(o.total_amount) FILTER (WHERE o.status NOT IN ('CANCELLED', 'REFUNDED')), 0)::float AS lifetime_value,
      COUNT(o.id)::bigint AS order_count
    FROM users u
    LEFT JOIN orders o ON o.user_id = u.id
    WHERE u.role = 'CUSTOMER'
    GROUP BY u.id, u.email, u.name
    HAVING COUNT(o.id) > 0
    ORDER BY lifetime_value DESC
    LIMIT 500
  `;

  const avgClv =
    clvRows.length > 0
      ? clvRows.reduce((s, r) => s + r.lifetime_value, 0) / clvRows.length
      : 0;

  const topCustomers = await prisma.$queryRaw<{ user_id: string; email: string; name: string | null; spend: number; orders: bigint }[]>`
    SELECT u.id AS user_id, u.email, u.name,
      COALESCE(SUM(o.total_amount) FILTER (WHERE o.status NOT IN ('CANCELLED', 'REFUNDED')), 0)::float AS spend,
      COUNT(o.id)::bigint AS orders
    FROM users u
    INNER JOIN orders o ON o.user_id = u.id
    WHERE u.role = 'CUSTOMER'
    GROUP BY u.id, u.email, u.name
    ORDER BY spend DESC
    LIMIT 25
  `;

  const geo = await prisma.$queryRaw<{ country: string; customers: bigint; revenue: number; orders: bigint }[]>`
    SELECT COALESCE(o.country, 'Unknown') AS country,
      COUNT(DISTINCT o.user_id)::bigint AS customers,
      COALESCE(SUM(o.total_amount) FILTER (WHERE o.status NOT IN ('CANCELLED', 'REFUNDED')), 0)::float AS revenue,
      COUNT(o.id)::bigint AS orders
    FROM orders o
    WHERE o.created_at >= ${start} AND o.created_at <= ${end}
    GROUP BY COALESCE(o.country, 'Unknown')
    ORDER BY revenue DESC
    LIMIT 50
  `;

  const tRev = geo.reduce((s, g) => s + g.revenue, 0);

  return {
    period: { start, end },
    newVsReturning: newVsReturning.map(r => ({
      segment: r.bucket,
      customers: Number(r.customers),
      orders: Number(r.orders),
      revenue: r.revenue,
    })),
    customerLifetimeValue: {
      average: Math.round(avgClv * 100) / 100,
      sampleSize: clvRows.length,
    },
    topCustomers: topCustomers.map(r => ({
      userId: r.user_id,
      email: r.email,
      name: r.name,
      spend: r.spend,
      orders: Number(r.orders),
    })),
    geographicDistribution: geo.map(g => ({
      country: g.country,
      customers: Number(g.customers),
      revenue: g.revenue,
      orders: Number(g.orders),
      percentOfRevenue: tRev > 0 ? Math.round((g.revenue / tRev) * 10000) / 100 : 0,
    })),
  };
}
