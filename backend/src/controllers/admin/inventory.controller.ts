import { Response } from 'express';
import { PipelineStatus, ProductStatus } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { AuthRequest } from '../../middleware/auth.middleware';
import { logAdminAction } from '../../services/admin/adminLog.service';

export async function getInventoryAlerts(_req: AuthRequest, res: Response) {
  try {
    const dismissed = await prisma.inventoryAlertDismissal.findMany({
      select: { productId: true },
    });
    const dismissedIds = dismissed.map(d => d.productId);

    const [outOfStock, lowStock, pipelineRejected, restockedAudits] = await Promise.all([
      prisma.product.findMany({
        where: {
          stockQuantity: { lte: 0 },
          status: { not: ProductStatus.ARCHIVED },
          ...(dismissedIds.length ? { id: { notIn: dismissedIds } } : {}),
        },
        orderBy: { updatedAt: 'desc' },
        take: 100,
        include: { supplier: { select: { id: true, name: true } } },
      }),
      prisma.product.findMany({
        where: {
          stockQuantity: { gt: 0, lt: 10 },
          status: { not: ProductStatus.ARCHIVED },
          ...(dismissedIds.length ? { id: { notIn: dismissedIds } } : {}),
        },
        orderBy: { stockQuantity: 'asc' },
        take: 100,
        include: { supplier: { select: { id: true, name: true } } },
      }),
      prisma.productPipeline.findMany({
        where: { status: PipelineStatus.REJECTED },
        orderBy: { reviewedAt: 'desc' },
        take: 50,
        include: { product: true },
      }),
      prisma.productMetricAudit.findMany({
        where: {
          kind: 'stock',
          recordedAt: { gte: new Date(Date.now() - 7 * 86400000) },
        },
        orderBy: { recordedAt: 'desc' },
        take: 80,
      }),
    ]);

    const recentProdIds = [...new Set(restockedAudits.map(a => a.productId))].slice(0, 25);

    const restockedProducts = await prisma.product.findMany({
      where: { id: { in: recentProdIds } },
      include: { supplier: { select: { id: true, name: true } } },
    });

    res.json({
      outOfStock,
      lowStock,
      syncErrors: pipelineRejected.map(p => ({
        pipelineId: p.id,
        productId: p.productId,
        reason: p.rejectedReason,
        supplierName: p.supplierName,
        product: p.product,
      })),
      recentlyRestocked: restockedProducts.map(p => ({
        productId: p.id,
        title: p.title,
        stockQuantity: p.stockQuantity,
        supplier: p.supplier?.name,
        updatedAt: p.updatedAt,
      })),
    });
  } catch (e) {
    console.error('[admin.inventory.alerts]', e);
    res.status(500).json({ error: 'Failed to load inventory alerts' });
  }
}

export async function dismissInventoryAlert(req: AuthRequest, res: Response) {
  try {
    const productId = req.params.productId;
    const p = await prisma.product.findUnique({ where: { id: productId } });
    if (!p) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await prisma.inventoryAlertDismissal.upsert({
      where: { productId },
      create: { productId, adminId: req.user!.id },
      update: { adminId: req.user!.id, dismissedAt: new Date() },
    });

    await logAdminAction(req, {
      action: 'inventory.alert_dismiss',
      resource: 'product',
      resourceId: productId,
    });

    res.json({ ok: true, productId });
  } catch (e) {
    console.error('[admin.inventory.dismiss]', e);
    res.status(500).json({ error: 'Failed to dismiss alert' });
  }
}
