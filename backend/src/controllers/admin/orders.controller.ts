import { Response } from 'express';
import { OrderStatus, Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../../db/prisma';
import { AuthRequest } from '../../middleware/auth.middleware';
import { parsePagination } from '../../utils/pagination';
import {
  transitionOrder,
  adminForceOrderStatus,
  InvalidOrderTransitionError,
} from '../../services/order/stateMachine';
import { processRefundWithAgentGate } from '../../services/payment/refund.service';
import { logAdminAction } from '../../services/admin/adminLog.service';

function orderLookupWhere(param: string): Prisma.OrderWhereInput {
  return {
    OR: [{ id: param }, { orderNumber: { equals: param, mode: 'insensitive' } }],
  };
}

export async function listOrders(req: AuthRequest, res: Response) {
  try {
    const { page, limit, skip } = parsePagination(req, 20, 100);
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const statusStr = typeof req.query.status === 'string' ? req.query.status : undefined;
    const supplierId = typeof req.query.supplier === 'string' ? req.query.supplier : undefined;
    const gateway = typeof req.query.gateway === 'string' ? req.query.gateway : undefined;
    const from = req.query.from ? new Date(String(req.query.from)) : undefined;
    const to = req.query.to ? new Date(String(req.query.to)) : undefined;
    const sort = typeof req.query.sort === 'string' ? req.query.sort : 'createdAt';
    const dir: Prisma.SortOrder = req.query.dir === 'asc' ? 'asc' : 'desc';

    const where: Prisma.OrderWhereInput = {};

    if (statusStr && Object.values(OrderStatus).includes(statusStr as OrderStatus)) {
      where.status = statusStr as OrderStatus;
    }

    const createdFilter: Prisma.DateTimeFilter = {};
    if (from && !Number.isNaN(from.getTime())) createdFilter.gte = from;
    if (to && !Number.isNaN(to.getTime())) createdFilter.lte = to;
    if (Object.keys(createdFilter).length > 0) {
      where.createdAt = createdFilter;
    }

    if (supplierId) {
      where.items = { some: { supplierId } };
    }
    if (gateway) {
      where.gateway = { equals: gateway, mode: 'insensitive' };
    }

    if (q.length > 0) {
      where.OR = [
        { id: { contains: q, mode: 'insensitive' } },
        { orderNumber: { contains: q, mode: 'insensitive' } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
        { items: { some: { trackingNumber: { contains: q, mode: 'insensitive' } } } },
      ];
    }

    let orderBy: Prisma.OrderOrderByWithRelationInput = { createdAt: dir };
    if (sort === 'amount') orderBy = { totalAmount: dir };
    else if (sort === 'status') orderBy = { status: dir };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          payment: true,
          commission: true,
          tracking: { orderBy: { timestamp: 'asc' } },
          items: {
            include: {
              product: { select: { id: true, title: true, sku: true, slug: true, imagesJson: true } },
              supplier: { select: { id: true, name: true } },
            },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    res.json({
      orders,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (e) {
    console.error('[admin.orders.list]', e);
    res.status(500).json({ error: 'Failed to list orders' });
  }
}

export async function getOrderById(req: AuthRequest, res: Response) {
  try {
    const idParam = req.params.id;
    const order = await prisma.order.findFirst({
      where: orderLookupWhere(idParam),
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, addressJson: true } },
        payment: true,
        commission: true,
        tracking: { orderBy: { timestamp: 'asc' } },
        transitionLogs: { orderBy: { createdAt: 'asc' } },
        items: {
          include: {
            product: true,
            supplier: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const submissionLogs = order.transitionLogs.filter(
      l =>
        /supplier|submit|routing/i.test(l.reason) ||
        (typeof l.metaJson === 'object' &&
          l.metaJson !== null &&
          JSON.stringify(l.metaJson).toLowerCase().includes('supplier'))
    );

    const orderContext =
      order.orderNumber && order.userId
        ? await prisma.supportTicket.findMany({
            where: { userId: order.userId, message: { contains: order.orderNumber } },
            take: 5,
            orderBy: { createdAt: 'desc' },
          })
        : [];

    res.json({
      order,
      supplierSubmissionLogs: submissionLogs,
      relatedTickets: orderContext,
    });
  } catch (e) {
    console.error('[admin.orders.get]', e);
    res.status(500).json({ error: 'Failed to load order' });
  }
}

export async function putOrderStatus(req: AuthRequest, res: Response) {
  const schema = z.object({
    status: z.nativeEnum(OrderStatus),
    reason: z.string().min(1).max(2000),
    force: z.boolean().optional(),
    runAutomation: z.boolean().optional(),
  });

  try {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const order = await prisma.order.findFirst({
      where: orderLookupWhere(req.params.id),
    });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const { status, reason, force, runAutomation } = parsed.data;
    const meta = { adminId: req.user!.id, note: reason };

    try {
      await transitionOrder(order.id, status, `admin:${reason}`, {
        meta,
        skipAutomation: runAutomation === false,
      });
    } catch (e) {
      if (e instanceof InvalidOrderTransitionError && force) {
        await adminForceOrderStatus(order.id, status, `admin_force:${reason}`, {
          meta,
          skipAutomation: runAutomation !== true,
        });
      } else if (e instanceof InvalidOrderTransitionError) {
        return res.status(400).json({
          error: 'Invalid status transition',
          code: e.code,
          from: e.from,
          to: e.to,
          hint: 'Retry with force=true to override',
        });
      } else {
        throw e;
      }
    }

    const updated = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        user: { select: { name: true, email: true } },
        payment: true,
        items: { include: { product: { select: { title: true } } } },
      },
    });

    await logAdminAction(req, {
      action: 'order.status_update',
      resource: 'order',
      resourceId: order.id,
      meta: { to: status, reason, force: !!force },
    });

    res.json({ order: updated });
  } catch (e) {
    console.error('[admin.orders.status]', e);
    res.status(500).json({ error: 'Failed to update order status' });
  }
}

export async function postOrderRefund(req: AuthRequest, res: Response) {
  try {
    const order = await prisma.order.findFirst({
      where: orderLookupWhere(req.params.id),
    });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const result = await processRefundWithAgentGate(order.id, { force: true });

    if (!result.ok) {
      return res.status(400).json({ error: 'Refund could not be completed', detail: result });
    }

    await logAdminAction(req, {
      action: 'order.refund',
      resource: 'order',
      resourceId: order.id,
    });

    const updated = await prisma.order.findUnique({
      where: { id: order.id },
      include: { payment: true },
    });

    res.json({ ok: true, order: updated, result });
  } catch (e) {
    console.error('[admin.orders.refund]', e);
    const msg = e instanceof Error ? e.message : 'Refund failed';
    res.status(500).json({ error: msg });
  }
}
