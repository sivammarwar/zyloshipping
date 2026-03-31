/**
 * Admin dashboard API — /api/admin/*
 * Public: POST /auth/login
 * MFA setup (authenticated admin, no MFA gate): /auth/setup-mfa, /auth/verify-mfa
 * All other routes: JWT + requireAdmin + requireMFA
 */

import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import { authMiddleware, AuthRequest, ownerMiddleware } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/requireAdmin';
import { requireMFA } from '../middleware/requireMFA';
import { adminAuthLimiter } from '../middleware/rateLimiter.middleware';
import { AgentStatus, PipelineStatus, TicketStatus, RefundStatus } from '@prisma/client';

import { adminLogin } from '../controllers/admin/authLogin.controller';
import { setupMfa, verifyMfa } from '../controllers/admin/mfa.controller';
import { getDashboardStats } from '../controllers/admin/dashboard.controller';
import {
  listOrders,
  getOrderById,
  putOrderStatus,
  postOrderRefund,
} from '../controllers/admin/orders.controller';
import {
  listProducts,
  postProductsSync,
  putProduct,
  deleteProduct,
  getProductAnalytics,
} from '../controllers/admin/products.controller';
import {
  listSuppliers,
  getSupplierProducts,
  postSupplierSync,
  getSupplierOrders,
} from '../controllers/admin/suppliers.controller';
import {
  getAgentsStatus,
  getAgentLogs,
  postAgentToggle,
} from '../controllers/admin/agents.controller';
import {
  getAnalyticsRevenue,
  getAnalyticsProducts,
  getAnalyticsCustomers,
  getAnalyticsSuppliers,
  getAnalyticsPayments,
} from '../controllers/admin/analytics.controller';
import pricingRoutes from './admin/pricing';
import { listCommissions, getCommissionsSummary } from '../controllers/admin/commissions.controller';
import { getInventoryAlerts, dismissInventoryAlert } from '../controllers/admin/inventory.controller';
import {
  listTickets,
  getTicket,
  respondTicket,
  escalateTicket,
} from '../controllers/admin/support.controller';
import { getAdminHealth } from '../controllers/admin/health.controller';
import { logAdminAction } from '../services/admin/adminLog.service';

const router = Router();

router.post('/auth/login', adminAuthLimiter, adminLogin);
router.post('/auth/setup-mfa', authMiddleware, requireAdmin, setupMfa);
router.post('/auth/verify-mfa', authMiddleware, requireAdmin, verifyMfa);

router.use(authMiddleware, requireAdmin, requireMFA);

router.get('/dashboard/stats', getDashboardStats);

router.get('/orders', listOrders);
router.get('/orders/:id', getOrderById);
router.put('/orders/:id/status', putOrderStatus);
router.post('/orders/:id/refund', postOrderRefund);

router.get('/products', listProducts);
router.post('/products/sync', postProductsSync);
router.get('/products/:id/analytics', getProductAnalytics);
router.put('/products/:id', putProduct);
router.delete('/products/:id', deleteProduct);

router.get('/suppliers', listSuppliers);
router.get('/suppliers/:id/products', getSupplierProducts);
router.post('/suppliers/:id/sync', postSupplierSync);
router.get('/suppliers/:id/orders', getSupplierOrders);

router.use('/pricing', pricingRoutes);

router.get('/agents/status', getAgentsStatus);
router.get('/agents', getAgentsStatus);
router.get('/agents/:name/logs', getAgentLogs);
router.post('/agents/:name/toggle', postAgentToggle);

router.get('/analytics/revenue', getAnalyticsRevenue);
router.get('/analytics/products', getAnalyticsProducts);
router.get('/analytics/customers', getAnalyticsCustomers);
router.get('/analytics/suppliers', getAnalyticsSuppliers);
router.get('/analytics/payments', getAnalyticsPayments);

router.get('/commissions', listCommissions);
router.get('/commissions/summary', getCommissionsSummary);

router.get('/inventory/alerts', getInventoryAlerts);
router.post('/inventory/alerts/:productId/dismiss', dismissInventoryAlert);

router.get('/support/tickets', listTickets);
router.get('/support/tickets/:id', getTicket);
router.put('/support/tickets/:id/respond', respondTicket);
router.put('/support/tickets/:id/escalate', escalateTicket);

router.get('/health', getAdminHealth);

// Legacy-style support path (redirects frontend expecting /support)
router.get('/support', listTickets);
router.patch('/support/:id', async (req: AuthRequest, res: Response) => {
  const { status } = req.body;
  const ticket = await prisma.supportTicket.update({
    where: { id: req.params.id },
    data: {
      status,
      resolvedAt: status === TicketStatus.CLOSED ? new Date() : undefined,
    },
  });
  await logAdminAction(req, { action: 'support.legacy_patch', resource: 'ticket', resourceId: ticket.id });
  res.json({ ticket });
});

router.get('/settings', async (_req: AuthRequest, res: Response) => {
  const settings = await prisma.storeSettings.findUnique({ where: { id: 'singleton' } });
  const apiKeys = await prisma.apiKey.findMany({ orderBy: { createdAt: 'desc' } });
  const team = await prisma.teamMember.findMany({ orderBy: { role: 'asc' } });
  res.json({ settings, apiKeys, team });
});

router.patch('/settings', async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    storeName: z.string().optional(),
    contactEmail: z.string().email().optional(),
    timezone: z.string().optional(),
    currency: z.string().optional(),
    storeUrl: z.string().optional(),
    tagline: z.string().optional(),
    supportEmail: z.string().email().optional(),
    maintenanceMode: z.boolean().optional(),
    emailOrders: z.boolean().optional(),
    emailLowStock: z.boolean().optional(),
    emailRefunds: z.boolean().optional(),
    smsOrders: z.boolean().optional(),
    freeShippingThreshold: z.number().optional(),
    defaultShippingRate: z.number().optional(),
    processingDays: z.number().optional(),
    activeCouponCode: z.string().optional(),
    couponDiscountPct: z.number().optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const settings = await prisma.storeSettings.update({
    where: { id: 'singleton' },
    data: parsed.data,
  });
  await logAdminAction(req, { action: 'settings.update', resource: 'store_settings' });
  res.json({ settings });
});

router.post('/settings/team/invite', ownerMiddleware, async (req: AuthRequest, res: Response) => {
  const { name, email, role } = req.body;
  const existing = await prisma.teamMember.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: 'Team member already exists' });
  const member = await prisma.teamMember.create({
    data: { name, email, role: role ?? 'EDITOR' },
  });
  await logAdminAction(req, { action: 'settings.team_invite', resource: 'team_member', resourceId: member.id });
  res.status(201).json({ member });
});

router.delete('/settings/team/:email', ownerMiddleware, async (req: AuthRequest, res: Response) => {
  await prisma.teamMember.delete({ where: { email: req.params.email } });
  await logAdminAction(req, { action: 'settings.team_remove', resource: 'team_member', resourceId: req.params.email });
  res.json({ success: true });
});

router.get('/settings/api-keys', async (_req: AuthRequest, res: Response) => {
  const keys = await prisma.apiKey.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({ keys });
});

router.delete('/settings/api-keys/:id', ownerMiddleware, async (req: AuthRequest, res: Response) => {
  await prisma.apiKey.update({
    where: { id: req.params.id },
    data: { status: 'revoked' },
  });
  await logAdminAction(req, { action: 'settings.api_key_revoke', resource: 'api_key', resourceId: req.params.id });
  res.json({ success: true });
});

router.get('/suppliers/:id/pipeline', async (req: AuthRequest, res: Response) => {
  const pipeline = await prisma.productPipeline.findMany({
    where: { supplierName: { contains: req.params.id, mode: 'insensitive' } },
    include: { product: { select: { title: true, sku: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ pipeline });
});

router.get('/pipeline', async (_req: AuthRequest, res: Response) => {
  const pipeline = await prisma.productPipeline.findMany({
    include: { product: { select: { sku: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ pipeline });
});

router.patch('/pipeline/:id', async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    status: z.nativeEnum(PipelineStatus),
    rejectedReason: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const item = await prisma.productPipeline.update({
    where:   { id: req.params.id },
    data: {
      status: parsed.data.status,
      rejectedReason: parsed.data.rejectedReason,
      reviewedBy: req.user!.id,
      reviewedAt: new Date(),
    },
  });
  await logAdminAction(req, { action: 'pipeline.update', resource: 'product_pipeline', resourceId: item.id });
  res.json({ item });
});

router.patch('/agents/:id', async (req: AuthRequest, res: Response) => {
  const { isPaused } = req.body;
  const agent = await prisma.agentState.update({
    where:   { id: req.params.id },
    data: {
      isPaused,
      status: isPaused ? AgentStatus.PAUSED : AgentStatus.RUNNING,
    },
  });
  await logAdminAction(req, { action: 'agent.pause_toggle', resource: 'agent_state', resourceId: agent.id });
  res.json({ agent });
});

// ── Low Stock Alerts ──────────────────────────────────────────
import { getActiveLowStockAlerts, dismissLowStockAlert } from '../services/inventory/alerts.service';

router.get('/inventory/alerts', async (req: AuthRequest, res: Response) => {
  try {
    const alerts = await getActiveLowStockAlerts();
    res.json({ alerts });
  } catch (error) {
    console.error('[admin] Error fetching low stock alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

router.post('/inventory/alerts/:productId/dismiss', async (req: AuthRequest, res: Response) => {
  try {
    await dismissLowStockAlert(req.params.productId);
    await logAdminAction(req, { 
      action: 'inventory.dismiss_alert', 
      resource: 'product', 
      resourceId: req.params.productId 
    });
    res.json({ success: true });
  } catch (error) {
    console.error('[admin] Error dismissing alert:', error);
    res.status(500).json({ error: 'Failed to dismiss alert' });
  }
});

// ── Refund Management ──────────────────────────────────────────
import { processRefundRequest } from '../services/refund/refundProcessor.service';
import { calculateScheduledDate } from '../services/refund/refundProcessor.service';

router.get('/refunds', async (req: AuthRequest, res: Response) => {
  try {
    const { status, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    
    const validStatus = Object.values(RefundStatus).includes(status as RefundStatus) ? status as RefundStatus : undefined;
    
    const refundWhere = validStatus ? { status: validStatus } : undefined;
    const [refunds, total] = await Promise.all([
      (prisma.refundRequest.findMany as Function)({
        where: refundWhere,
        include: {
          order: { 
            select: { 
              orderNumber: true, 
              totalAmount: true,
              user: { select: { name: true, email: true } }
            } 
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      (prisma.refundRequest.count as Function)(refundWhere ? { where: refundWhere } : {}),
    ]);
    
    res.json({
      refunds,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('[admin] Error fetching refunds:', error);
    res.status(500).json({ error: 'Failed to fetch refunds' });
  }
});

router.get('/refunds/:id', async (req: AuthRequest, res: Response) => {
  try {
    const refund = await (prisma.refundRequest.findUnique as Function)({
      where: { id: req.params.id },
      include: {
        order: {
          include: {
            items: { include: { product: true } },
            payment: true,
            user: true,
          },
        },
      },
    });
    
    if (!refund) {
      return res.status(404).json({ error: 'Refund request not found' });
    }
    
    res.json(refund);
  } catch (error) {
    console.error('[admin] Error fetching refund:', error);
    res.status(500).json({ error: 'Failed to fetch refund' });
  }
});

router.post('/refunds/:id/approve', async (req: AuthRequest, res: Response) => {
  try {
    const { adminNotes } = req.body;
    
    const refund = await prisma.refundRequest.update({
      where: { id: req.params.id },
      data: {
        status: 'APPROVED',
        approvalType: 'MANUAL',
        approvedAt: new Date(),
        scheduledFor: calculateScheduledDate(new Date()),
        adminNotes,
      },
    });
    
    await prisma.order.update({
      where: { id: refund.orderId },
      data: { status: 'REFUND_REQUESTED' },
    });
    
    await logAdminAction(req, {
      action: 'refund.approve',
      resource: 'refund',
      resourceId: req.params.id,
    });
    
    res.json({ success: true, refund });
  } catch (error) {
    console.error('[admin] Error approving refund:', error);
    res.status(500).json({ error: 'Failed to approve refund' });
  }
});

router.post('/refunds/:id/reject', async (req: AuthRequest, res: Response) => {
  try {
    const { reason, adminNotes } = req.body;
    
    if (!reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }
    
    const refund = await prisma.refundRequest.update({
      where: { id: req.params.id },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
        adminNotes,
      },
    });
    
    await logAdminAction(req, {
      action: 'refund.reject',
      resource: 'refund',
      resourceId: req.params.id,
    });
    
    res.json({ success: true, refund });
  } catch (error) {
    console.error('[admin] Error rejecting refund:', error);
    res.status(500).json({ error: 'Failed to reject refund' });
  }
});

router.post('/refunds/:id/process-now', async (req: AuthRequest, res: Response) => {
  try {
    await processRefundRequest(req.params.id);
    
    await logAdminAction(req, {
      action: 'refund.process_immediate',
      resource: 'refund',
      resourceId: req.params.id,
    });
    
    res.json({ success: true, message: 'Refund processed successfully' });
  } catch (error: any) {
    console.error('[admin] Error processing refund:', error);
    res.status(500).json({ error: error.message || 'Failed to process refund' });
  }
});

export default router;
