import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../db/prisma';

function isOrderNumber(id: string) {
  return /^ZY-\d+$/.test(id);
}

export async function getOrderTracking(req: AuthRequest, res: Response) {
  if (!isOrderNumber(req.params.id)) {
    return res.status(404).json({ error: 'Order not found' });
  }
  const isAdmin = ['ADMIN', 'OWNER'].includes(req.user!.role);

  const order = await prisma.order.findFirst({
    where: {
      orderNumber: req.params.id,
      ...(isAdmin ? {} : { userId: req.user!.id }),
    },
    include: {
      items: {
        include: { product: { select: { title: true, sku: true } }, supplier: true },
      },
      tracking: { orderBy: { timestamp: 'desc' } },
    },
  });

  if (!order) return res.status(404).json({ error: 'Order not found' });

  res.json({
    orderNumber: order.orderNumber,
    status: order.status,
    items: order.items.map(i => ({
      id: i.id,
      title: i.product.title,
      sku: i.product.sku,
      trackingNumber: i.trackingNumber,
      supplierOrderId: i.supplierOrderId,
      trackingEvents: i.trackingEventsJson,
    })),
    timeline: order.tracking,
  });
}
