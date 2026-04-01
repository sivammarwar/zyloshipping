import { Router, Response } from 'express';
import { prisma } from '../db/prisma';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createOrderSchema, refundSchema, bulkOrderUpdateSchema } from '../schemas/order.schema';
import { OrderStatus } from '@prisma/client';
import { getOrderTracking } from '../controllers/order.controller';
import { transitionOrder } from '../services/order/stateMachine';

const router = Router();

function isOrderNumber(id: string) {
  return /^ZY-\d+$/.test(id);
}

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const isAdmin = ['ADMIN', 'OWNER'].includes(req.user!.role);

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const search = String(req.query.search || '');
  const status = String(req.query.status || '');
  const gateway = String(req.query.gateway || '');

  const where: Record<string, unknown> = isAdmin ? {} : { userId: req.user!.id };

  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: 'insensitive' } },
      { user: { name: { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
    ];
  }
  if (status && status !== 'All') where.status = status as OrderStatus;
  if (gateway && gateway !== 'All') where.gateway = gateway;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        items: { include: { product: { select: { title: true } } } },
        payment: { select: { method: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  res.json({
    orders,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

router.get('/:id/tracking', authMiddleware, getOrderTracking);

router.get('/stats', authMiddleware, adminMiddleware, async (_req: AuthRequest, res: Response) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [total, todayCount, inTransit, refundRequests, revenue] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { createdAt: { gte: today } } }),
    prisma.order.count({ where: { status: OrderStatus.IN_TRANSIT } }),
    prisma.order.count({ where: { status: OrderStatus.REFUND_REQUESTED } }),
    prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: { status: { notIn: [OrderStatus.CANCELLED, OrderStatus.REFUNDED] } },
    }),
  ]);

  res.json({
    total,
    todayCount,
    inTransit,
    refundRequests,
    totalRevenue: revenue._sum.totalAmount ?? 0,
  });
});

async function createOrderHandler(req: AuthRequest, res: Response) {
  const { items, shippingAddress, couponCode, note, isAdminOrder } = req.body;

  const products = await prisma.product.findMany({
    where: { id: { in: items.map((i: { productId: string }) => i.productId) } },
    include: { supplier: true },
  });

  if (products.length !== items.length) {
    return res.status(400).json({ error: 'One or more products not found' });
  }

  for (const item of items) {
    const product = products.find(p => p.id === item.productId)!;
    if (product.stockQuantity < item.quantity) {
      return res.status(400).json({ error: `Insufficient stock for ${product.title}` });
    }
  }

  const settings = await prisma.storeSettings.findUnique({ where: { id: 'singleton' } });
  const subtotal = items.reduce((sum: number, item: { productId: string; quantity: number }) => {
    const product = products.find(p => p.id === item.productId)!;
    return sum + product.price * item.quantity;
  }, 0);

  let discountAmount = 0;
  if (couponCode && settings?.activeCouponCode === couponCode && settings?.couponDiscountPct != null) {
    discountAmount = subtotal * (settings.couponDiscountPct / 100);
  }

  const shippingAmount =
    subtotal > (settings?.freeShippingThreshold ?? 200) ? 0 : settings?.defaultShippingRate ?? 9.99;
  const totalAmount = subtotal - discountAmount + shippingAmount;

  const lastOrder = await prisma.order.findFirst({ orderBy: { createdAt: 'desc' } });
  const lastNum = lastOrder ? parseInt(lastOrder.orderNumber.replace('ZY-', ''), 10) : 28420;
  const orderNumber = `ZY-${lastNum + 1}`;

  const order = await prisma.order.create({
    data: {
      orderNumber,
      userId: req.user!.id,
      status: OrderStatus.PENDING,
      totalAmount,
      shippingAddressJson: shippingAddress,
      shippingAmount,
      discountAmount,
      couponCode,
      note,
      isAdminOrder: isAdminOrder ?? false,
      items: {
        create: items.map((item: { productId: string; quantity: number }) => {
          const product = products.find(p => p.id === item.productId)!;
          return {
            productId: product.id,
            supplierId: product.supplierId,
            quantity: item.quantity,
            unitPrice: product.price,
            supplierCost: product.supplierCost,
          };
        }),
      },
    },
    include: { items: true },
  });

  res.status(201).json({ order });
}

router.post('/create', authMiddleware, validate(createOrderSchema), createOrderHandler);
router.post('/', authMiddleware, validate(createOrderSchema), createOrderHandler);

router.put('/:id/cancel', authMiddleware, async (req: AuthRequest, res: Response) => {
  if (!isOrderNumber(req.params.id)) {
    return res.status(404).json({ error: 'Order not found' });
  }
  const isAdmin = ['ADMIN', 'OWNER'].includes(req.user!.role);
  const order = await prisma.order.findFirst({
    where: {
      orderNumber: req.params.id,
      ...(isAdmin ? {} : { userId: req.user!.id }),
    },
  });

  if (!order) return res.status(404).json({ error: 'Order not found' });

  const cancellable: OrderStatus[] = [
    OrderStatus.PENDING,
    OrderStatus.PAYMENT_CONFIRMED,
    OrderStatus.SUBMITTED_TO_SUPPLIER,
    OrderStatus.SUPPLIER_CONFIRMED,
  ];
  if (!cancellable.includes(order.status)) {
    return res.status(400).json({ error: 'Order cannot be cancelled in this state' });
  }

  try {
    const updated = await transitionOrder(order.id, OrderStatus.CANCELLED, 'customer_or_admin_cancel');
    res.json({ order: updated });
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
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
      user: { select: { name: true, email: true, phone: true } },
      items: { include: { product: true, supplier: true } },
      payment: true,
      commission: true,
      tracking: { orderBy: { timestamp: 'desc' } },
    },
  });

  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json({ order });
});

router.patch('/:id/status', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  if (!isOrderNumber(req.params.id)) {
    return res.status(404).json({ error: 'Order not found' });
  }
  const { status } = req.body;

  if (!Object.values(OrderStatus).includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const order = await prisma.order.update({
    where: { orderNumber: req.params.id },
    data: { status },
  });

  res.json({ order });
});

router.post('/:id/refund', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { reason } = req.body;
  
  if (!reason || reason.trim().length < 10) {
    return res.status(400).json({ 
      error: 'Please provide a detailed reason for the refund (minimum 10 characters)' 
    });
  }

  if (!isOrderNumber(req.params.id)) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  const order = await prisma.order.findFirst({
    where: { orderNumber: req.params.id },
  });

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const isAdmin = ['ADMIN', 'OWNER'].includes(req.user!.role);
  if (!isAdmin && order.userId !== req.user!.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const { processRefundRequest } = await import('../agents/refundDispute.agent');
    const result = await processRefundRequest(order.id, req.user!.id, reason);
    
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }
    
    res.json({
      success: true,
      message: result.message,
      refundRequestId: result.refundRequestId,
    });
  } catch (error: any) {
    console.error('[Orders] Refund request failed:', error);
    res.status(500).json({ error: 'Failed to process refund request' });
  }
});

router.post('/bulk', authMiddleware, adminMiddleware, validate(bulkOrderUpdateSchema), async (req: AuthRequest, res: Response) => {
  const { orderNumbers, status } = req.body;

  await prisma.order.updateMany({
    where: { orderNumber: { in: orderNumbers } },
    data: { status },
  });

  res.json({ updated: orderNumbers.length });
});

export default router;
