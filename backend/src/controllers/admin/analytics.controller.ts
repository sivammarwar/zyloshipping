import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../db/prisma';
import { AuthRequest } from '../../middleware/auth.middleware';
import { getRevenueTimeSeries, RevenuePeriod } from '../../services/analytics/revenue.service';
import { getProductAnalyticsBundle } from '../../services/analytics/product.service';
import { getCustomerAnalyticsBundle } from '../../services/analytics/customer.service';

const periodSchema = z.enum(['day', 'week', 'month', 'year']);

export async function getAnalyticsRevenue(req: AuthRequest, res: Response) {
  try {
    const period = periodSchema.safeParse(req.query.period).success
      ? (req.query.period as RevenuePeriod)
      : 'month';
    const startDate = req.query.startDate ? new Date(String(req.query.startDate)) : undefined;
    const endDate = req.query.endDate ? new Date(String(req.query.endDate)) : undefined;
    const data = await getRevenueTimeSeries({ period, startDate, endDate });
    res.json(data);
  } catch (e) {
    console.error('[admin.analytics.revenue]', e);
    res.status(500).json({ error: 'Failed to load revenue analytics' });
  }
}

export async function getAnalyticsProducts(req: AuthRequest, res: Response) {
  try {
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    const data = await getProductAnalyticsBundle({ category });
    res.json(data);
  } catch (e) {
    console.error('[admin.analytics.products]', e);
    res.status(500).json({ error: 'Failed to load product analytics' });
  }
}

export async function getAnalyticsCustomers(req: AuthRequest, res: Response) {
  try {
    const start = req.query.startDate ? new Date(String(req.query.startDate)) : undefined;
    const end = req.query.endDate ? new Date(String(req.query.endDate)) : undefined;
    const data = await getCustomerAnalyticsBundle({ periodStart: start, periodEnd: end });
    res.json(data);
  } catch (e) {
    console.error('[admin.analytics.customers]', e);
    res.status(500).json({ error: 'Failed to load customer analytics' });
  }
}

export async function getAnalyticsSuppliers(_req: AuthRequest, res: Response) {
  try {
    const bySupplier = await prisma.$queryRaw<
      { supplier_id: string; revenue: number; orders: bigint; units: bigint }[]
    >`
      SELECT oi.supplier_id,
        COALESCE(SUM(oi.quantity * oi.unit_price), 0)::float AS revenue,
        COUNT(DISTINCT o.id)::bigint AS orders,
        COALESCE(SUM(oi.quantity), 0)::bigint AS units
      FROM order_items oi
      INNER JOIN orders o ON o.id = oi.order_id
      WHERE o.status NOT IN ('CANCELLED', 'REFUNDED')
      GROUP BY oi.supplier_id
      ORDER BY revenue DESC
    `;

    const successRows = await prisma.$queryRaw<{ supplier_id: string; delivered: bigint; total: bigint }[]>`
      SELECT oi.supplier_id,
        COUNT(DISTINCT o.id) FILTER (WHERE o.status IN ('DELIVERED', 'COMPLETED'))::bigint AS delivered,
        COUNT(DISTINCT o.id)::bigint AS total
      FROM order_items oi
      INNER JOIN orders o ON o.id = oi.order_id
      GROUP BY oi.supplier_id
    `;

    const shipRows = await prisma.$queryRaw<{ supplier_id: string; avg_days: number }[]>`
      SELECT oi.supplier_id,
        AVG(EXTRACT(EPOCH FROM (o.delivered_at - o.created_at)) / 86400)::float AS avg_days
      FROM order_items oi
      INNER JOIN orders o ON o.id = oi.order_id
      WHERE o.delivered_at IS NOT NULL
      GROUP BY oi.supplier_id
    `;

    const successMap = new Map(successRows.map(r => [r.supplier_id, r]));
    const shipMap = new Map(shipRows.map(r => [r.supplier_id, r.avg_days]));

    const suppliers = await prisma.supplier.findMany();
    const costMap = new Map(suppliers.map(s => [s.id, s]));

    const revenueBySupplier = bySupplier.map(r => {
      const s = successMap.get(r.supplier_id);
      const rate = s && Number(s.total) > 0 ? (Number(s.delivered) / Number(s.total)) * 100 : 0;
      const sup = costMap.get(r.supplier_id);
      const costEff =
        r.revenue > 0 && sup
          ? Math.round((1 - (sup.avgDeliveryDays * 0.02 + (sup.rating ?? 4) * 0.01)) * 100) / 100
          : 0;

      return {
        supplierId: r.supplier_id,
        revenue: r.revenue,
        orders: Number(r.orders),
        units: Number(r.units),
        orderSuccessRate: Math.round(rate * 100) / 100,
        avgShippingDays: Math.round((shipMap.get(r.supplier_id) ?? 0) * 100) / 100,
        costEfficiencyScore: costEff,
      };
    });

    res.json({ suppliers: revenueBySupplier });
  } catch (e) {
    console.error('[admin.analytics.suppliers]', e);
    res.status(500).json({ error: 'Failed to load supplier analytics' });
  }
}

export async function getAnalyticsPayments(_req: AuthRequest, res: Response) {
  try {
    const gatewayRows = await prisma.order.groupBy({
      by: ['gateway'],
      where: {
        gateway: { not: null },
        status: { notIn: ['CANCELLED', 'REFUNDED'] },
      },
      _sum: { totalAmount: true },
      _count: { _all: true },
    });

    const payHealth = await prisma.payment.groupBy({
      by: ['gateway', 'status'],
      _count: { _all: true },
      _avg: { amount: true },
    });

    const refunds = await prisma.order.groupBy({
      by: ['gateway'],
      where: { status: 'REFUNDED' },
      _count: { _all: true },
    });

    const refundMap = new Map(refunds.map(r => [r.gateway ?? 'unknown', r._count._all]));

    const normalized = gatewayRows.map(g => {
      const gw = (g.gateway ?? 'unknown').toLowerCase();
      const paid = payHealth.filter(p => (p.gateway ?? '').toLowerCase() === gw);
      const captured = paid.find(p => p.status === 'captured' || p.status === 'pending')?._count._all ?? 0;
      const failed = paid.find(p => p.status === 'failed')?._count._all ?? 0;
      const attempted = paid.reduce((s, p) => s + p._count._all, 0);
      const successRate = attempted > 0 ? Math.round((captured / attempted) * 10000) / 100 : 100;
      const refC = refundMap.get(g.gateway ?? '') ?? refundMap.get('unknown') ?? 0;
      const refundRate = g._count._all > 0 ? Math.round((refC / g._count._all) * 10000) / 100 : 0;
      const aov =
        g._count._all > 0 ? Math.round(((g._sum.totalAmount ?? 0) / g._count._all) * 100) / 100 : 0;

      return {
        gateway: g.gateway,
        revenue: g._sum.totalAmount ?? 0,
        orders: g._count._all,
        successRate,
        refundRate,
        averageOrderValue: aov,
      };
    });

    const methodRows = await prisma.$queryRaw<
      { method: string; revenue: number; orders: bigint }[]
    >`
      SELECT COALESCE(NULLIF(o.payment_method, ''), 'UNKNOWN') AS method,
        COALESCE(SUM(o.total_amount) FILTER (WHERE o.status NOT IN ('CANCELLED', 'REFUNDED')), 0)::float AS revenue,
        COUNT(*)::bigint AS orders
      FROM orders o
      WHERE o.status NOT IN ('CANCELLED', 'REFUNDED')
      GROUP BY 1
      ORDER BY revenue DESC
    `;

    res.json({
      byGateway: normalized,
      byPaymentMethod: methodRows.map(r => ({
        method: r.method,
        revenue: r.revenue,
        orders: Number(r.orders),
      })),
    });
  } catch (e) {
    console.error('[admin.analytics.payments]', e);
    res.status(500).json({ error: 'Failed to load payment analytics' });
  }
}
