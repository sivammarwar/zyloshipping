import { Response } from 'express';
import { OrderStatus, ProductStatus } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { AuthRequest } from '../../middleware/auth.middleware';

const EXCLUDE_REV = { notIn: [OrderStatus.CANCELLED, OrderStatus.REFUNDED] };

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfWeek(d: Date) {
  const x = startOfDay(d);
  const day = x.getDay();
  const diff = x.getDate() - day + (day === 0 ? -6 : 1);
  x.setDate(diff);
  return x;
}

function startOfMonth(d: Date) {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x;
}

function pctGrowth(curr: number, prev: number): number {
  if (prev <= 0) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 10000) / 100;
}

export async function getDashboardStats(_req: AuthRequest, res: Response) {
  const now = new Date();
  const today = startOfDay(now);
  const week = startOfWeek(now);
  const month = startOfMonth(now);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const [
    revToday,
    revWeek,
    revMonth,
    revAll,
    revYesterday,
    ordersTotal,
    pending,
    processing,
    shipped,
    delivered,
    cancelled,
    refunded,
    prodTotal,
    prodActive,
    prodOos,
    prodLow,
    custTotal,
    custNewToday,
    custNewWeek,
    commToday,
    commWeek,
    commMonth,
    returningRow,
    topRows,
    recentOrders,
  ] = await Promise.all([
    prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: { createdAt: { gte: today }, status: EXCLUDE_REV },
    }),
    prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: { createdAt: { gte: week }, status: EXCLUDE_REV },
    }),
    prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: { createdAt: { gte: month }, status: EXCLUDE_REV },
    }),
    prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: { status: EXCLUDE_REV },
    }),
    prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: { createdAt: { gte: yesterday, lt: today }, status: EXCLUDE_REV },
    }),
    prisma.order.count(),
    prisma.order.count({ where: { status: OrderStatus.PENDING } }),
    prisma.order.count({
      where: {
        status: {
          in: [
            OrderStatus.PAYMENT_CONFIRMED,
            OrderStatus.SUBMITTED_TO_SUPPLIER,
            OrderStatus.SUPPLIER_CONFIRMED,
          ],
        },
      },
    }),
    prisma.order.count({
      where: { status: { in: [OrderStatus.SHIPPED, OrderStatus.IN_TRANSIT] } },
    }),
    prisma.order.count({
      where: { status: { in: [OrderStatus.DELIVERED, OrderStatus.COMPLETED] } },
    }),
    prisma.order.count({ where: { status: OrderStatus.CANCELLED } }),
    prisma.order.count({ where: { status: OrderStatus.REFUNDED } }),
    prisma.product.count(),
    prisma.product.count({
      where: { status: { in: [ProductStatus.ACTIVE, ProductStatus.LOW] } },
    }),
    prisma.product.count({ where: { stockQuantity: { lte: 0 } } }),
    prisma.product.count({
      where: { stockQuantity: { gt: 0, lt: 10 } },
    }),
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.user.count({ where: { role: 'CUSTOMER', createdAt: { gte: today } } }),
    prisma.user.count({ where: { role: 'CUSTOMER', createdAt: { gte: week } } }),
    prisma.commission.aggregate({
      _sum: { netCommission: true },
      where: { order: { createdAt: { gte: today } } },
    }),
    prisma.commission.aggregate({
      _sum: { netCommission: true },
      where: { order: { createdAt: { gte: week } } },
    }),
    prisma.commission.aggregate({
      _sum: { netCommission: true },
      where: { order: { createdAt: { gte: month } } },
    }),
    prisma.$queryRaw<{ c: bigint }[]>`
      SELECT COUNT(*)::bigint AS c
      FROM (
        SELECT user_id FROM orders GROUP BY user_id HAVING COUNT(*) > 1
      ) x
    `,
    prisma.$queryRaw<{ id: string; title: string; sales: bigint; revenue: number }[]>`
      SELECT p.id, p.title,
        COALESCE(SUM(oi.quantity), 0)::bigint AS sales,
        COALESCE(SUM(oi.quantity * oi.unit_price), 0)::float AS revenue
      FROM products p
      INNER JOIN order_items oi ON oi.product_id = p.id
      INNER JOIN orders o ON o.id = oi.order_id
      WHERE o.status NOT IN ('CANCELLED', 'REFUNDED')
      GROUP BY p.id, p.title
      ORDER BY revenue DESC
      LIMIT 5
    `,
    prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } } },
    }),
  ]);

  const rt = revToday._sum?.totalAmount ?? 0;
  const ry = revYesterday._sum?.totalAmount ?? 0;

  res.json({
    revenue: {
      today: rt,
      thisWeek: revWeek._sum?.totalAmount ?? 0,
      thisMonth: revMonth._sum?.totalAmount ?? 0,
      allTime: revAll._sum?.totalAmount ?? 0,
      growth: pctGrowth(rt, ry),
    },
    orders: {
      total: ordersTotal,
      pending,
      processing,
      shipped,
      delivered,
      cancelled,
      refunded,
    },
    products: {
      total: prodTotal,
      active: prodActive,
      outOfStock: prodOos,
      lowStock: prodLow,
    },
    customers: {
      total: custTotal,
      newToday: custNewToday,
      newThisWeek: custNewWeek,
      returning: Number(returningRow[0]?.c ?? 0n),
    },
    commissions: {
      today: commToday._sum.netCommission ?? 0,
      thisWeek: commWeek._sum.netCommission ?? 0,
      thisMonth: commMonth._sum.netCommission ?? 0,
    },
    topProducts: topRows.map(r => ({
      id: r.id,
      title: r.title,
      sales: Number(r.sales),
      revenue: r.revenue,
    })),
    recentOrders: recentOrders.map(o => ({
      id: o.id,
      customer: o.user?.email ?? o.user?.name ?? '—',
      amount: o.totalAmount,
      status: o.status,
      createdAt: o.createdAt,
    })),
  });
}
