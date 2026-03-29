import { Response } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { AuthRequest } from '../../middleware/auth.middleware';
import { parsePagination } from '../../utils/pagination';

export async function listCommissions(req: AuthRequest, res: Response) {
  try {
    const { page, limit, skip } = parsePagination(req, 20, 100);
    const from = req.query.from ? new Date(String(req.query.from)) : undefined;
    const to = req.query.to ? new Date(String(req.query.to)) : undefined;
    const supplierId = typeof req.query.supplier === 'string' ? req.query.supplier : undefined;
    const gateway = typeof req.query.gateway === 'string' ? req.query.gateway : undefined;

    const createdFilter: Prisma.DateTimeFilter = {};
    if (from && !Number.isNaN(from.getTime())) createdFilter.gte = from;
    if (to && !Number.isNaN(to.getTime())) createdFilter.lte = to;
    const orderWhere: Prisma.OrderWhereInput = {};
    if (Object.keys(createdFilter).length > 0) orderWhere.createdAt = createdFilter;
    if (gateway) {
      orderWhere.gateway = { equals: gateway, mode: 'insensitive' };
    }
    if (supplierId) {
      orderWhere.items = { some: { supplierId } };
    }

    const where: Prisma.CommissionWhereInput =
      Object.keys(orderWhere).length > 0 ? { order: orderWhere } : {};

    const [rows, total, agg] = await Promise.all([
      prisma.commission.findMany({
        where,
        skip,
        take: limit,
        orderBy: { order: { createdAt: 'desc' } },
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              createdAt: true,
              totalAmount: true,
              gateway: true,
              status: true,
            },
          },
        },
      }),
      prisma.commission.count({ where }),
      prisma.commission.aggregate({
        where,
        _sum: {
          revenue: true,
          supplierCost: true,
          gatewayFee: true,
          shippingCost: true,
          netCommission: true,
        },
      }),
    ]);

    res.json({
      commissions: rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      totals: {
        revenue: agg._sum.revenue ?? 0,
        supplierCost: agg._sum.supplierCost ?? 0,
        gatewayFee: agg._sum.gatewayFee ?? 0,
        shippingCost: agg._sum.shippingCost ?? 0,
        netCommission: agg._sum.netCommission ?? 0,
      },
    });
  } catch (e) {
    console.error('[admin.commissions.list]', e);
    res.status(500).json({ error: 'Failed to list commissions' });
  }
}

export async function getCommissionsSummary(req: AuthRequest, res: Response) {
  const schema = z.enum(['day', 'week', 'month']);
  try {
    const bucket = schema.safeParse(req.query.granularity).success
      ? (req.query.granularity as z.infer<typeof schema>)
      : 'month';
    const trunc = bucket === 'day' ? 'day' : bucket === 'week' ? 'week' : 'month';

    const rows = await prisma.$queryRaw<
      { label: Date; net: number; revenue: number; margin_pct: number; gateway_fee: number }[]
    >`
      SELECT date_trunc(${Prisma.raw(`'${trunc}'`)}, o.created_at)::date AS label,
        COALESCE(SUM(c.net_commission), 0)::float AS net,
        COALESCE(SUM(c.revenue), 0)::float AS revenue,
        CASE WHEN COALESCE(SUM(c.revenue), 0) > 0
          THEN (COALESCE(SUM(c.net_commission), 0) / COALESCE(SUM(c.revenue), 1)) * 100
          ELSE 0 END::float AS margin_pct,
        COALESCE(SUM(c.gateway_fee), 0)::float AS gateway_fee
      FROM commissions c
      INNER JOIN orders o ON o.id = c.order_id
      WHERE o.status NOT IN ('CANCELLED', 'REFUNDED')
      GROUP BY 1
      ORDER BY 1 DESC
      LIMIT 120
    `;

    const feeByGw = await prisma.$queryRaw<{ gateway: string; fee: number }[]>`
      SELECT COALESCE(o.gateway, 'unknown') AS gateway,
        COALESCE(SUM(c.gateway_fee), 0)::float AS fee
      FROM commissions c
      INNER JOIN orders o ON o.id = c.order_id
      GROUP BY COALESCE(o.gateway, 'unknown')
      ORDER BY fee DESC
    `;

    res.json({
      granularity: bucket,
      series: rows.map(r => ({
        date: r.label.toISOString().slice(0, 10),
        netCommission: r.net,
        revenue: r.revenue,
        marginPercent: Math.round(r.margin_pct * 100) / 100,
        gatewayFees: r.gateway_fee,
      })),
      gatewayFeeAnalysis: feeByGw.map(r => ({ gateway: r.gateway, totalGatewayFees: r.fee })),
    });
  } catch (e) {
    console.error('[admin.commissions.summary]', e);
    res.status(500).json({ error: 'Failed to load commission summary' });
  }
}
