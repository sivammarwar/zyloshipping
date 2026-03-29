import { Response } from 'express';
import { OrderStatus, Prisma } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { AuthRequest } from '../../middleware/auth.middleware';
import { parsePagination } from '../../utils/pagination';
import { getOrderAutomationQueue } from '../../jobs/queue';
import { logAdminAction } from '../../services/admin/adminLog.service';

export async function listSuppliers(_req: AuthRequest, res: Response) {
  try {
    const suppliers = await prisma.supplier.findMany({ orderBy: { name: 'asc' } });
    const enriched = await Promise.all(
      suppliers.map(async s => {
        const [orderAgg, deliveredSubset] = await Promise.all([
          prisma.order.aggregate({
            where: { items: { some: { supplierId: s.id } } },
            _count: { _all: true },
          }),
          prisma.order.count({
            where: {
              items: { some: { supplierId: s.id } },
              status: { in: [OrderStatus.DELIVERED, OrderStatus.COMPLETED] },
            },
          }),
        ]);
        const total = orderAgg._count._all;
        const successRate = total > 0 ? Math.round((deliveredSubset / total) * 10000) / 100 : s.uptimePercent;

        let health: 'healthy' | 'degraded' | 'down' = 'healthy';
        if (s.uptimePercent < 95) health = 'degraded';
        if (s.status === 'disconnected' || !s.lastSyncAt) health = 'degraded';

        return {
          id: s.id,
          name: s.name,
          logo: s.logo,
          status: s.status,
          lastSyncAt: s.lastSyncAt,
          totalOrders: total || s.totalOrders,
          successRate,
          avgShippingDays: s.avgDeliveryDays,
          totalProducts: s.totalProducts,
          activeProducts: s.activeProducts,
          health,
        };
      })
    );

    res.json({ suppliers: enriched });
  } catch (e) {
    console.error('[admin.suppliers.list]', e);
    res.status(500).json({ error: 'Failed to list suppliers' });
  }
}

export async function getSupplierProducts(req: AuthRequest, res: Response) {
  try {
    const { page, limit, skip } = parsePagination(req, 20, 100);
    const supplierId = req.params.id;

    const where: Prisma.ProductWhereInput = { supplierId };
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { title: 'asc' },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      products,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (e) {
    console.error('[admin.suppliers.products]', e);
    res.status(500).json({ error: 'Failed to load supplier products' });
  }
}

export async function postSupplierSync(req: AuthRequest, res: Response) {
  try {
    const supplierId = req.params.id;
    const exists = await prisma.supplier.findUnique({ where: { id: supplierId } });
    if (!exists) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    const q = getOrderAutomationQueue();
    if (!q) {
      return res.status(503).json({ error: 'Job queue unavailable' });
    }

    const job = await q.add(
      'inventorySync',
      { supplierId },
      { jobId: `manual-inv-${supplierId}-${Date.now()}` }
    );

    await logAdminAction(req, {
      action: 'supplier.sync',
      resource: 'supplier',
      resourceId: supplierId,
      meta: { jobId: job.id },
    });

    res.status(202).json({ jobId: job.id, message: 'Inventory sync queued for supplier' });
  } catch (e) {
    console.error('[admin.suppliers.sync]', e);
    res.status(500).json({ error: 'Failed to queue sync' });
  }
}

export async function getSupplierOrders(req: AuthRequest, res: Response) {
  try {
    const supplierId = req.params.id;
    const { page, limit, skip } = parsePagination(req, 20, 100);

    const where: Prisma.OrderWhereInput = {
      items: { some: { supplierId } },
    };

    const [orders, total, delivered, failed] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { email: true, name: true } },
          items: { where: { supplierId }, include: { product: { select: { title: true } } } },
        },
      }),
      prisma.order.count({ where }),
      prisma.order.count({
        where: {
          ...where,
          status: { in: [OrderStatus.DELIVERED, OrderStatus.COMPLETED] },
        },
      }),
      prisma.order.count({
        where: {
          ...where,
          status: { in: [OrderStatus.CANCELLED, OrderStatus.REFUNDED] },
        },
      }),
    ]);

    const successRate = total > 0 ? Math.round((delivered / total) * 10000) / 100 : 0;
    const failureRate = total > 0 ? Math.round((failed / total) * 10000) / 100 : 0;

    res.json({
      orders,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      rates: { successRate, failureRate },
    });
  } catch (e) {
    console.error('[admin.suppliers.orders]', e);
    res.status(500).json({ error: 'Failed to load supplier orders' });
  }
}
