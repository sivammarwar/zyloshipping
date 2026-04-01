// backend/src/routes/cart.routes.ts
// Handles TWO cart systems:
//   1. Customer carts (/api/cart) — Redis-backed with DB persistence
//   2. Admin cart (/api/cart/admin) — admin order placement + abandoned cart monitoring

import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  addToCartSchema,
  updateCartSchema,
  couponSchema,
  adminAddToCartSchema,
  adminUpdateCartItemSchema,
  adminCheckoutSchema
} from '../schemas/cart.schema';
import { redis, TTL } from '../utils/redis';
import { CartStatus } from '@prisma/client';

const router = Router();

// ═══════════════════════════════════════════════════════════════
// CUSTOMER CART
// ═══════════════════════════════════════════════════════════════

// ── GET /api/cart  ─────────────────────────────────────────────
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  // Try Redis first (fast path)
  const cacheKey = `cart:${req.user!.id}`;
  try {
    if (redis) {
      const cached = await redis.get(cacheKey);
      if (cached) return res.json(cached);
    }
  } catch { /* fall through to DB */ }

  const cart = await prisma.cart.findUnique({
    where: { userId: req.user!.id },
    include: {
      items: {
        include: {
          product: {
            include: { supplier: { select: { name: true } } }
          }
        }
      }
    },
  });

  if (!cart) {
    const newCart = await prisma.cart.create({ data: { userId: req.user!.id } });
    return res.json({ cart: { ...newCart, items: [] } });
  }

  const enriched = enrichCart(cart);

  // Cache in Redis for 5 min
  try {
    if (redis) await redis.set(cacheKey, enriched, { ex: TTL.CART });
  } catch {}

  res.json({ cart: enriched });
});

async function postCartAdd(req: AuthRequest, res: Response) {
  const { productId, quantity } = req.body;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return res.status(404).json({ error: 'Product not found' });
  if (product.stockQuantity < quantity) {
    return res.status(400).json({ error: `Only ${product.stockQuantity} units available` });
  }

  let cart = await prisma.cart.findUnique({ where: { userId: req.user!.id } });
  if (!cart) {
    cart = await prisma.cart.create({ data: { userId: req.user!.id } });
  }

  await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId: cart.id, productId } },
    update: { quantity: { increment: quantity } },
    create: { cartId: cart.id, productId, quantity },
  });

  await prisma.cart.update({
    where: { id: cart.id },
    data: { status: CartStatus.ACTIVE, abandonedAt: null },
  });

  try {
    if (redis) await redis.del(`cart:${req.user!.id}`);
  } catch {}

  res.status(201).json({ success: true });
}

router.post('/add', authMiddleware, validate(addToCartSchema), postCartAdd);
router.post('/items', authMiddleware, validate(addToCartSchema), postCartAdd);

// ── PUT /api/cart/update (alias) ───────────────────────────────
router.put('/update', authMiddleware, validate(updateCartSchema), async (req: AuthRequest, res: Response) => {
  const { productId } = req.query;
  if (!productId || typeof productId !== 'string') {
    return res.status(400).json({ error: 'productId query parameter required' });
  }
  (req as AuthRequest & { params: { productId: string } }).params = { productId };
  req.body = { quantity: req.body.quantity };
  return patchCartItem(req, res);
});

// ── PATCH /api/cart/items/:productId  (update quantity) ───────
async function patchCartItem(req: AuthRequest, res: Response) {
  const { quantity } = req.body;
  if (!quantity || quantity < 1) {
    return res.status(400).json({ error: 'Quantity must be at least 1' });
  }

  const cart = await prisma.cart.findUnique({ where: { userId: req.user!.id } });
  if (!cart) return res.status(404).json({ error: 'Cart not found' });

  const product = await prisma.product.findUnique({ where: { id: req.params.productId } });
  if (!product) return res.status(404).json({ error: 'Product not found' });
  if (product.stockQuantity < quantity) {
    return res.status(400).json({ error: `Only ${product.stockQuantity} units available` });
  }

  await prisma.cartItem.update({
    where: { cartId_productId: { cartId: cart.id, productId: req.params.productId } },
    data:  { quantity },
  });

  try {
    if (redis) await redis.del(`cart:${req.user!.id}`);
  } catch {}
  res.json({ success: true });
}

router.patch('/items/:productId', authMiddleware, validate(updateCartSchema), patchCartItem);

async function deleteCartItem(req: AuthRequest, res: Response) {
  const cart = await prisma.cart.findUnique({ where: { userId: req.user!.id } });
  if (!cart) return res.status(404).json({ error: 'Cart not found' });

  await prisma.cartItem.deleteMany({
    where: { cartId: cart.id, productId: req.params.productId },
  });

  try {
    if (redis) await redis.del(`cart:${req.user!.id}`);
  } catch {}
  res.json({ success: true });
}

router.delete('/remove', authMiddleware, async (req: AuthRequest, res: Response) => {
  const productId = String(req.query.productId || req.body?.productId || '');
  if (!productId) return res.status(400).json({ error: 'productId required' });
  (req as AuthRequest & { params: { productId: string } }).params = { productId };
  return deleteCartItem(req, res);
});

// ── DELETE /api/cart/items/:productId  (remove item) ──────────
router.delete('/items/:productId', authMiddleware, deleteCartItem);

// ── DELETE /api/cart  (clear cart) ────────────────────────────
router.delete('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const cart = await prisma.cart.findUnique({ where: { userId: req.user!.id } });
  if (!cart) return res.json({ success: true });

  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  try {
    if (redis) await redis.del(`cart:${req.user!.id}`);
  } catch {}
  res.json({ success: true });
});

// ── POST /api/cart/validate-coupon ────────────────────────────
router.post('/validate-coupon', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { couponCode } = req.body;
  const settings = await prisma.storeSettings.findUnique({ where: { id: 'singleton' } });

  if (!settings?.activeCouponCode || settings.activeCouponCode !== couponCode?.toUpperCase()) {
    return res.status(400).json({ valid: false, error: 'Invalid coupon code' });
  }

  res.json({ valid: true, discountPct: settings.couponDiscountPct });
});

// ═══════════════════════════════════════════════════════════════
// ADMIN CART — admin order placement
// ═══════════════════════════════════════════════════════════════

// ── GET /api/cart/admin  (get admin's cart) ────────────────────
router.get('/admin', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  let cart = await prisma.adminCart.findUnique({
    where: { adminUserId: req.user!.id },
    include: {
      items: {
        include: {
          product: {
            include: { supplier: { select: { name: true, id: true } } }
          }
        }
      }
    },
  });

  if (!cart) {
    cart = await prisma.adminCart.create({
      data: { adminUserId: req.user!.id },
      include: { items: { include: { product: { include: { supplier: { select: { name: true, id: true } } } } } } },
    });
  }

  res.json({ cart: enrichAdminCart(cart) });
});

// ── POST /api/cart/admin/items  (add item to admin cart) ──────
router.post('/admin/items', authMiddleware, adminMiddleware, validate(adminAddToCartSchema), async (req: AuthRequest, res: Response) => {
  const { productId, quantity } = req.body;
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return res.status(404).json({ error: 'Product not found' });

  let cart = await prisma.adminCart.findUnique({ where: { adminUserId: req.user!.id } });
  if (!cart) {
    cart = await prisma.adminCart.create({ data: { adminUserId: req.user!.id } });
  }

  await prisma.adminCartItem.upsert({
    where:  { adminCartId_productId: { adminCartId: cart.id, productId } },
    update: { quantity: { increment: quantity }, savedForLater: false },
    create: { adminCartId: cart.id, productId, quantity },
  });

  res.status(201).json({ success: true });
});

// ── PATCH /api/cart/admin/items/:productId ─────────────────────
router.patch('/admin/items/:productId', authMiddleware, adminMiddleware, validate(adminUpdateCartItemSchema), async (req: AuthRequest, res: Response) => {
  const cart = await prisma.adminCart.findUnique({ where: { adminUserId: req.user!.id } });
  if (!cart) return res.status(404).json({ error: 'Admin cart not found' });

  await prisma.adminCartItem.update({
    where: { adminCartId_productId: { adminCartId: cart.id, productId: req.params.productId } },
    data:  req.body,
  });

  res.json({ success: true });
});

// ── DELETE /api/cart/admin/items/:productId ────────────────────
router.delete('/admin/items/:productId', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  const cart = await prisma.adminCart.findUnique({ where: { adminUserId: req.user!.id } });
  if (!cart) return res.status(404).json({ error: 'Admin cart not found' });

  await prisma.adminCartItem.deleteMany({
    where: { adminCartId: cart.id, productId: req.params.productId },
  });
  res.json({ success: true });
});

// ── DELETE /api/cart/admin  (clear admin cart) ────────────────
router.delete('/admin', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  const cart = await prisma.adminCart.findUnique({ where: { adminUserId: req.user!.id } });
  if (!cart) return res.json({ success: true });
  await prisma.adminCartItem.deleteMany({ where: { adminCartId: cart.id } });
  res.json({ success: true });
});

// ── POST /api/cart/admin/checkout  (place admin order) ────────
router.post('/admin/checkout', authMiddleware, adminMiddleware, validate(adminCheckoutSchema), async (req: AuthRequest, res: Response) => {
  const { shippingAddress, couponCode, note } = req.body;

  const adminCart = await prisma.adminCart.findUnique({
    where: { adminUserId: req.user!.id },
    include: { items: { include: { product: true } } },
  });

  if (!adminCart || adminCart.items.filter(i => !i.savedForLater).length === 0) {
    return res.status(400).json({ error: 'Admin cart is empty' });
  }

  const activeItems = adminCart.items.filter(i => !i.savedForLater);
  const subtotal = activeItems.reduce((s, i) => s + i.product.price * i.quantity, 0);

  const settings = await prisma.storeSettings.findUnique({ where: { id: 'singleton' } });
  const shippingAmount = subtotal > (settings?.freeShippingThreshold ?? 200) ? 0 : (settings?.defaultShippingRate ?? 9.99);
  let discountAmount = 0;
  if (couponCode && settings?.activeCouponCode === couponCode && settings?.couponDiscountPct != null) {
    discountAmount = subtotal * (settings.couponDiscountPct / 100);
  }

  const lastOrder = await prisma.order.findFirst({ orderBy: { createdAt: 'desc' } });
  const lastNum = lastOrder ? parseInt(lastOrder.orderNumber.replace('ZY-', '')) : 28420;
  const orderNumber = `ZY-${lastNum + 1}`;

  const order = await prisma.order.create({
    data: {
      orderNumber,
      userId: req.user!.id,
      status: 'PENDING',
      totalAmount: subtotal - discountAmount + shippingAmount,
      shippingAddressJson: shippingAddress,
      shippingAmount,
      discountAmount,
      couponCode,
      note,
      isAdminOrder: true,
      items: {
        create: activeItems.map(item => ({
          productId:    item.productId,
          supplierId:   item.product.supplierId,
          quantity:     item.quantity,
          unitPrice:    item.product.price,
          supplierCost: item.product.supplierCost,
        })),
      },
    },
  });

  // Clear active items from admin cart (keep saved-for-later)
  await prisma.adminCartItem.deleteMany({
    where: { adminCartId: adminCart.id, savedForLater: false },
  });

  res.status(201).json({ order });
});

// ═══════════════════════════════════════════════════════════════
// ABANDONED CART MONITORING (admin)
// ═══════════════════════════════════════════════════════════════

// ── GET /api/cart/abandoned  (admin: list abandoned carts) ────
router.get('/abandoned', authMiddleware, adminMiddleware, async (_req: AuthRequest, res: Response) => {
  const snapshots = await prisma.abandonedCartSnapshot.findMany({
    orderBy: { abandonedAt: 'desc' },
    take: 50,
  });

  const stats = {
    total:        snapshots.length,
    totalValue:   snapshots.reduce((s, c) => s + c.cartValue, 0),
    recovered:    snapshots.filter(c => c.recoveryStatus === 'recovered').length,
    emailSent:    snapshots.filter(c => c.recoveryStatus === 'email_sent').length,
    pending:      snapshots.filter(c => c.recoveryStatus === 'pending').length,
  };

  res.json({ snapshots, stats });
});

// ── POST /api/cart/abandoned/:id/send-recovery  ────────────────
router.post('/abandoned/:id/send-recovery', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  const snapshot = await prisma.abandonedCartSnapshot.findUnique({
    where: { id: req.params.id },
  });
  if (!snapshot) return res.status(404).json({ error: 'Snapshot not found' });

  // Update status + send recovery email (email sending handled by email queue)
  await prisma.abandonedCartSnapshot.update({
    where: { id: req.params.id },
    data:  { recoveryStatus: 'email_sent' },
  });

  const { getOrderAutomationQueue } = await import('../jobs/queue');
  const queue = getOrderAutomationQueue();
  if (queue && snapshot.userId && snapshot.cartId) {
    await queue.add('abandonedCart', { userId: snapshot.userId, cartId: snapshot.cartId }, { delay: 0 });
  }
  res.json({ success: true, message: `Recovery email queued for ${snapshot.userEmail}` });
});

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function enrichCart(cart: any) {
  const subtotal = cart.items.reduce(
    (s: number, i: any) => s + i.product.price * i.quantity, 0
  );
  const totalCost = cart.items.reduce(
    (s: number, i: any) => s + i.product.supplierCost * i.quantity, 0
  );
  const profit = subtotal - totalCost;
  const margin = subtotal > 0 ? Math.round((profit / subtotal) * 100) : 0;

  return { ...cart, subtotal, totalCost, profit, margin };
}

function enrichAdminCart(cart: any) {
  const activeItems = cart.items.filter((i: any) => !i.savedForLater);
  const savedItems  = cart.items.filter((i: any) => i.savedForLater);

  const subtotal = activeItems.reduce(
    (s: number, i: any) => s + i.product.price * i.quantity, 0
  );
  const totalCost = activeItems.reduce(
    (s: number, i: any) => s + i.product.supplierCost * i.quantity, 0
  );
  const profit = subtotal - totalCost;
  const margin = subtotal > 0 ? Math.round((profit / subtotal) * 100) : 0;

  return { ...cart, activeItems, savedItems, subtotal, totalCost, profit, margin };
}

export default router;