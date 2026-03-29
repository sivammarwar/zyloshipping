import { Prisma } from '@prisma/client';
import { prisma } from '../../db/prisma';

type ProductAggRow = {
  id: string;
  title: string;
  category: string;
  revenue: number;
  units: bigint;
  margin_pct: number;
};

/** Best / worst sellers, margins, category mix — aggregations in PostgreSQL. */
export async function getProductAnalyticsBundle(opts?: { category?: string }) {
  const categoryFilter =
    opts?.category && opts.category !== 'all'
      ? Prisma.sql`AND p.category = ${opts.category}`
      : Prisma.empty;

  const revenueRank = await prisma.$queryRaw<ProductAggRow[]>`
    SELECT p.id, p.title, p.category,
      COALESCE(SUM(oi.quantity * oi.unit_price), 0)::float AS revenue,
      COALESCE(SUM(oi.quantity), 0)::bigint AS units,
      CASE WHEN COALESCE(SUM(oi.quantity * oi.unit_price), 0) > 0
        THEN (COALESCE(SUM(oi.quantity * (oi.unit_price - oi.supplier_cost)), 0)
          / COALESCE(SUM(oi.quantity * oi.unit_price), 1)) * 100
        ELSE 0 END::float AS margin_pct
    FROM products p
    INNER JOIN order_items oi ON oi.product_id = p.id
    INNER JOIN orders o ON o.id = oi.order_id
    WHERE o.status NOT IN ('CANCELLED', 'REFUNDED')
    ${categoryFilter}
    GROUP BY p.id, p.title, p.category
  `;

  const bestByRevenue = [...revenueRank].sort((a, b) => b.revenue - a.revenue).slice(0, 15);
  const bestByUnits = [...revenueRank].sort((a, b) => Number(b.units - a.units)).slice(0, 15);
  const worstPerforming = [...revenueRank].sort((a, b) => a.revenue - b.revenue).slice(0, 15);
  const highestMargin = [...revenueRank].filter(r => r.revenue > 0).sort((a, b) => b.margin_pct - a.margin_pct).slice(0, 15);

  const catFilter2 =
    opts?.category && opts.category !== 'all'
      ? Prisma.sql`AND p.category = ${opts.category}`
      : Prisma.empty;

  const categoryBreakdown = await prisma.$queryRaw<{ category: string; revenue: number; units: bigint }[]>`
    SELECT p.category,
      COALESCE(SUM(oi.quantity * oi.unit_price), 0)::float AS revenue,
      COALESCE(SUM(oi.quantity), 0)::bigint AS units
    FROM order_items oi
    INNER JOIN orders o ON o.id = oi.order_id
    INNER JOIN products p ON p.id = oi.product_id
    WHERE o.status NOT IN ('CANCELLED', 'REFUNDED')
    ${catFilter2}
    GROUP BY p.category
    ORDER BY revenue DESC
  `;

  return {
    bestSellingByRevenue: bestByRevenue.map(r => ({
      id: r.id,
      title: r.title,
      category: r.category,
      revenue: r.revenue,
      units: Number(r.units),
      marginPercent: Math.round(r.margin_pct * 100) / 100,
    })),
    bestSellingByUnits: bestByUnits.map(r => ({
      id: r.id,
      title: r.title,
      category: r.category,
      revenue: r.revenue,
      units: Number(r.units),
    })),
    worstPerforming: worstPerforming.map(r => ({
      id: r.id,
      title: r.title,
      category: r.category,
      revenue: r.revenue,
      units: Number(r.units),
    })),
    highestMargin: highestMargin.map(r => ({
      id: r.id,
      title: r.title,
      category: r.category,
      marginPercent: Math.round(r.margin_pct * 100) / 100,
      revenue: r.revenue,
    })),
    categoryBreakdown: categoryBreakdown.map(c => ({
      category: c.category,
      revenue: c.revenue,
      units: Number(c.units),
    })),
  };
}
