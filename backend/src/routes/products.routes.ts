import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { ProductStatus } from '@prisma/client';
import { searchProducts } from '../services/algolia.service';
import { redis, KEYS, TTL } from '../utils/redis';

const router = Router();

function slugify(title: string) {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 96) +
    '-' +
    Math.random().toString(36).slice(2, 6)
  );
}

function mapStorefront(p: {
  id: string;
  slug: string;
  title: string;
  category: string;
  price: number;
  supplierCost: number;
  rating: number;
  totalSales: number;
  status: ProductStatus;
  imagesJson: unknown;
}) {
  const images = Array.isArray(p.imagesJson) ? (p.imagesJson as string[]) : [];
  const originalPrice = Math.round(p.price * 2.1);
  return {
    id: p.id,
    slug: p.slug,
    name: p.title,
    category: p.category,
    price: p.price,
    originalPrice,
    rating: Math.min(5, Math.round(p.rating || 0)),
    reviewCount: p.totalSales,
    badge:
      p.status === ProductStatus.LOW
        ? 'Low stock'
        : p.totalSales > 2000
          ? 'Bestseller'
          : undefined,
    featured: false,
    imageUrl: images[0],
  };
}

router.get('/', async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const search = String(req.query.search || req.query.q || '');
  const category = String(req.query.category || '');
  const supplier = String(req.query.supplier || '');
  const status = String(req.query.status || '');
  const sortBy = String(req.query.sortBy || 'totalSales');
  const sortDir = String(req.query.sortDir || 'desc') as 'asc' | 'desc';

  if (
    search &&
    process.env.ALGOLIA_APP_ID &&
    (process.env.ALGOLIA_ADMIN_KEY || process.env.ALGOLIA_API_KEY)
  ) {
    const alg = await searchProducts(search, {
      category: category === 'All' ? undefined : category,
      page,
      hitsPerPage: limit,
    });
    if (alg) {
      const ids = alg.hits.map((h: { objectID: string }) => h.objectID);
      const products = await prisma.product.findMany({
        where: { id: { in: ids } },
        include: { supplier: { select: { name: true, id: true } } },
      });
      const mapped = products.map(p => ({
        ...p,
        margin: Math.round(((p.price - p.supplierCost) / Math.max(p.price, 0.01)) * 100),
        storefront: mapStorefront(p),
      }));
      return res.json({
        products: mapped,
        pagination: {
          page,
          limit,
          total: alg.nbHits,
          pages: Math.ceil(alg.nbHits / limit),
        },
        source: 'algolia',
      });
    }
  }

  const where: Record<string, unknown> = {};
  const isAdmin = req.headers['x-admin'] === 'true';
  if (!isAdmin) {
    where.status = { in: [ProductStatus.ACTIVE, ProductStatus.LOW] };
  } else if (status && status !== 'All') {
    where.status = status.toUpperCase() as ProductStatus;
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
      { slug: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (category && category !== 'All') where.category = category;
  if (supplier && supplier !== 'All') where.supplierId = supplier.toLowerCase();

  const validSortFields = ['totalSales', 'price', 'stockQuantity', 'title', 'createdAt'];
  const orderBy = validSortFields.includes(sortBy) ? { [sortBy]: sortDir } : { totalSales: 'desc' as const };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { supplier: { select: { name: true, id: true } } },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  const withMargin = products.map(p => ({
    ...p,
    margin: Math.round(((p.price - p.supplierCost) / Math.max(p.price, 0.01)) * 100),
    storefront: mapStorefront(p),
  }));

  res.json({
    products: withMargin,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    source: 'database',
  });
});

router.get('/stats', authMiddleware, adminMiddleware, async (_req, res: Response) => {
  const [total, active, low, outOfStock] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { status: ProductStatus.ACTIVE } }),
    prisma.product.count({ where: { status: ProductStatus.LOW } }),
    prisma.product.count({ where: { stockQuantity: 0 } }),
  ]);
  res.json({ total, active, low, outOfStock });
});

router.get('/slug/:slug', async (req: Request, res: Response) => {
  const cacheKey = KEYS.productCache(req.params.slug);
  try {
    if (redis) {
      const cached = await redis.get(cacheKey);
      if (cached != null) {
        const body = typeof cached === 'string' ? JSON.parse(cached) : cached;
        return res.json(body);
      }
    }
  } catch { /* continue */ }

  const product = await prisma.product.findUnique({
    where: { slug: req.params.slug },
    include: {
      supplier: { select: { name: true, id: true, avgDeliveryDays: true } },
      reviews: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  });

  if (!product) return res.status(404).json({ error: 'Product not found' });

  const reviewAgg = await prisma.review.aggregate({
    where: { productId: product.id },
    _avg: { rating: true },
    _count: { _all: true },
  });

  const body = {
    product: {
      ...product,
      name: product.title,
      originalPrice: Math.round(product.price * 2.1),
      rating: reviewAgg._avg.rating ?? product.rating,
      reviewCount: reviewAgg._count._all,
      margin: Math.round(((product.price - product.supplierCost) / Math.max(product.price, 0.01)) * 100),
    },
  };

  try {
    if (redis) await redis.set(cacheKey, JSON.stringify(body), { ex: TTL.PRODUCT });
  } catch { /* ignore */ }

  res.json(body);
});

router.get('/:id', async (req: Request, res: Response) => {
  const product = await prisma.product.findFirst({
    where: {
      OR: [{ id: req.params.id }, { sku: req.params.id }, { slug: req.params.id }],
    },
    include: {
      supplier: { select: { name: true, id: true, avgDeliveryDays: true } },
      reviews: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!product) return res.status(404).json({ error: 'Product not found' });

  res.json({
    product: {
      ...product,
      name: product.title,
      margin: Math.round(((product.price - product.supplierCost) / Math.max(product.price, 0.01)) * 100),
    },
  });
});

router.post('/', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    supplierId: z.string(),
    sku: z.string().min(1),
    slug: z.string().min(1).optional(),
    title: z.string().min(1),
    description: z.string(),
    price: z.number().positive(),
    supplierCost: z.number().positive(),
    stockQuantity: z.number().min(0),
    category: z.string(),
    imagesJson: z.array(z.string()).optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const slug = parsed.data.slug ?? slugify(parsed.data.title);

  const product = await prisma.product.create({
    data: {
      ...parsed.data,
      slug,
      imagesJson: parsed.data.imagesJson ?? [],
    },
  });
  res.status(201).json({ product });
});

const updateSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  supplierCost: z.number().positive().optional(),
  stockQuantity: z.number().min(0).optional(),
  status: z.nativeEnum(ProductStatus).optional(),
  category: z.string().optional(),
  imagesJson: z.array(z.string()).optional(),
  slug: z.string().optional(),
});

router.patch('/:id', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: parsed.data,
  });
  res.json({ product });
});

router.put('/:id', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: parsed.data,
  });
  res.json({ product });
});

router.post('/bulk', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    ids: z.array(z.string()),
    status: z.nativeEnum(ProductStatus),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  await prisma.product.updateMany({
    where: { id: { in: parsed.data.ids } },
    data: { status: parsed.data.status },
  });

  res.json({ updated: parsed.data.ids.length });
});

router.delete('/:id', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  await prisma.product.update({
    where: { id: req.params.id },
    data: { status: ProductStatus.HIDDEN },
  });
  res.json({ success: true });
});

export default router;
