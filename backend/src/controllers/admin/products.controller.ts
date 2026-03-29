import { Response } from 'express';
import { ProductStatus, Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../../db/prisma';
import { AuthRequest } from '../../middleware/auth.middleware';
import { parsePagination } from '../../utils/pagination';
import { indexProduct, removeProductFromAlgolia } from '../../services/algolia.service';
import { logAdminAction } from '../../services/admin/adminLog.service';
import { getOrderAutomationQueue } from '../../jobs/queue';

function marginPct(price: number, cost: number): number {
  if (price <= 0) return 0;
  return Math.round(((price - cost) / price) * 10000) / 100;
}

export async function listProducts(req: AuthRequest, res: Response) {
  try {
    const { page, limit, skip } = parsePagination(req, 20, 100);
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    const supplierId = typeof req.query.supplier === 'string' ? req.query.supplier : undefined;
    const statusStr = typeof req.query.status === 'string' ? req.query.status : undefined;

    const where: Prisma.ProductWhereInput = {
      ...(category && category !== 'all' ? { category } : {}),
      ...(supplierId ? { supplierId } : {}),
      ...(statusStr && Object.values(ProductStatus).includes(statusStr as ProductStatus)
        ? { status: statusStr as ProductStatus }
        : {}),
      ...(q.length > 0
        ? {
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { sku: { contains: q, mode: 'insensitive' } },
              { slug: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: { supplier: { select: { id: true, name: true } } },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      products: rows.map(p => ({
        ...p,
        marginPercent: marginPct(p.price, p.supplierCost),
        salesCount: p.totalSales,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (e) {
    console.error('[admin.products.list]', e);
    res.status(500).json({ error: 'Failed to list products' });
  }
}

export async function postProductsSync(req: AuthRequest, res: Response) {
  try {
    const q = getOrderAutomationQueue();
    if (!q) {
      return res.status(503).json({ error: 'Job queue unavailable (REDIS_URL)' });
    }
    const job = await q.add('productIngestion', {}, { jobId: `manual-ingest-${Date.now()}` });
    await logAdminAction(req, { action: 'products.sync_queued', resource: 'job', resourceId: String(job.id) });
    res.status(202).json({ jobId: job.id, message: 'Product ingestion queued' });
  } catch (e) {
    console.error('[admin.products.sync]', e);
    res.status(500).json({ error: 'Failed to queue ingestion' });
  }
}

export async function putProduct(req: AuthRequest, res: Response) {
  const schema = z.object({
    title: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    price: z.number().positive().optional(),
    status: z.nativeEnum(ProductStatus).optional(),
  });

  try {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const data = parsed.data;
    if (data.price != null && data.price !== existing.price) {
      await prisma.productMetricAudit.create({
        data: { productId: existing.id, kind: 'price', value: data.price },
      });
    }

    const updated = await prisma.product.update({
      where: { id: existing.id },
      data,
    });

    await indexProduct(updated.id).catch(() => {});

    await logAdminAction(req, {
      action: 'product.update',
      resource: 'product',
      resourceId: updated.id,
      meta: { fields: Object.keys(data) },
    });

    res.json({ product: updated });
  } catch (e) {
    console.error('[admin.products.put]', e);
    res.status(500).json({ error: 'Failed to update product' });
  }
}

export async function deleteProduct(req: AuthRequest, res: Response) {
  try {
    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const updated = await prisma.product.update({
      where: { id: existing.id },
      data: { status: ProductStatus.ARCHIVED },
    });

    await removeProductFromAlgolia(updated.id);
    await logAdminAction(req, {
      action: 'product.archive',
      resource: 'product',
      resourceId: updated.id,
    });

    res.json({ product: updated });
  } catch (e) {
    console.error('[admin.products.delete]', e);
    res.status(500).json({ error: 'Failed to archive product' });
  }
}

export async function getProductAnalytics(req: AuthRequest, res: Response) {
  try {
    const productId = req.params.id;
    const p = await prisma.product.findUnique({ where: { id: productId } });
    if (!p) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const [salesAgg, audits] = await Promise.all([
      prisma.orderItem.aggregate({
        _sum: { quantity: true },
        where: {
          productId,
          order: { status: { notIn: ['CANCELLED', 'REFUNDED'] } },
        },
      }),
      prisma.productMetricAudit.findMany({
        where: { productId },
        orderBy: { recordedAt: 'desc' },
        take: 200,
      }),
    ]);

    const revenueRow = await prisma.$queryRaw<{ revenue: number }[]>`
      SELECT COALESCE(SUM(oi.quantity * oi.unit_price), 0)::float AS revenue
      FROM order_items oi
      INNER JOIN orders o ON o.id = oi.order_id
      WHERE oi.product_id = ${productId}
        AND o.status NOT IN ('CANCELLED', 'REFUNDED')
    `;

    const revenue = revenueRow[0]?.revenue ?? 0;
    const unitsSold = Number(salesAgg._sum.quantity ?? 0);

    const priceHistory = audits.filter(a => a.kind === 'price').map(a => ({ at: a.recordedAt, price: a.value }));
    const stockHistory = audits.filter(a => a.kind === 'stock').map(a => ({ at: a.recordedAt, stock: a.value }));

    res.json({
      productId,
      salesCount: unitsSold || p.totalSales,
      revenue,
      views: 0,
      conversionRate: 0,
      stockHistory,
      priceChangeHistory: priceHistory,
    });
  } catch (e) {
    console.error('[admin.products.analytics]', e);
    res.status(500).json({ error: 'Failed to load product analytics' });
  }
}
