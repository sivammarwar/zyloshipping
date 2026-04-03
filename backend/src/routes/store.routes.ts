import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

// GET /api/user/store - Get current user's store
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const store = await prisma.store.findFirst({
      where: { ownerId: userId },
      include: {
        _count: {
          select: {
            products: true,
            storeOrders: true,
          },
        },
      },
    });

    if (!store) {
      return res.json({ store: null, stats: null });
    }

    // Calculate stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [todayOrders, weekOrders, monthOrders] = await Promise.all([
      prisma.storeOrder.count({
        where: {
          storeId: store.id,
          createdAt: { gte: today },
        },
      }),
      prisma.storeOrder.count({
        where: {
          storeId: store.id,
          createdAt: { gte: weekAgo },
        },
      }),
      prisma.storeOrder.count({
        where: {
          storeId: store.id,
          createdAt: { gte: monthAgo },
        },
      }),
    ]);

    const stats = {
      todayRevenue: todayOrders * 100, // Placeholder - calculate from actual orders
      todayOrders,
      weekRevenue: weekOrders * 100,
      weekOrders,
      monthRevenue: monthOrders * 100,
      monthOrders,
    };

    res.json({
      store: {
        id: store.id,
        name: store.name,
        slug: store.slug,
        description: store.description,
        logo: store.logo,
        isActive: store.isActive,
        isPublic: store.isPublic,
        totalProducts: store._count.products,
        totalOrders: store._count.storeOrders,
        totalRevenue: store.totalRevenue,
        currency: store.currency,
      },
      stats,
    });
  } catch (error) {
    console.error('Error fetching user store:', error);
    res.status(500).json({ error: 'Failed to fetch store' });
  }
});

// POST /api/user/store - Create a new store
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, description } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ error: 'Store name must be at least 2 characters' });
    }

    // Check if user already has a store
    const existingStore = await prisma.store.findFirst({
      where: { ownerId: userId },
    });

    if (existingStore) {
      return res.status(400).json({ error: 'You already have a store' });
    }

    // Generate unique slug from name
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    let slug = baseSlug;
    let counter = 1;

    while (await prisma.store.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const store = await prisma.store.create({
      data: {
        ownerId: userId,
        name: name.trim(),
        slug,
        description: description || null,
        isActive: true,
        isPublic: false,
      },
    });

    res.status(201).json({
      store: {
        id: store.id,
        name: store.name,
        slug: store.slug,
        description: store.description,
        logo: store.logo,
        isActive: store.isActive,
        isPublic: store.isPublic,
        totalProducts: 0,
        totalOrders: 0,
        totalRevenue: 0,
        currency: store.currency,
      },
      stats: {
        todayRevenue: 0,
        todayOrders: 0,
        weekRevenue: 0,
        weekOrders: 0,
        monthRevenue: 0,
        monthOrders: 0,
      },
    });
  } catch (error) {
    console.error('Error creating store:', error);
    res.status(500).json({ error: 'Failed to create store' });
  }
});

// PATCH /api/user/store - Update store settings
router.patch('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const store = await prisma.store.findFirst({
      where: { ownerId: userId },
    });

    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const { name, description, isPublic, logo } = req.body;
    const updateData: any = {};

    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description;
    if (isPublic !== undefined) updateData.isPublic = isPublic;
    if (logo !== undefined) updateData.logo = logo;

    const updatedStore = await prisma.store.update({
      where: { id: store.id },
      data: updateData,
    });

    res.json({
      store: {
        id: updatedStore.id,
        name: updatedStore.name,
        slug: updatedStore.slug,
        description: updatedStore.description,
        logo: updatedStore.logo,
        isActive: updatedStore.isActive,
        isPublic: updatedStore.isPublic,
        currency: updatedStore.currency,
      },
    });
  } catch (error) {
    console.error('Error updating store:', error);
    res.status(500).json({ error: 'Failed to update store' });
  }
});

// GET /api/user/store/public/:slug - Get public store by slug (no auth required)
router.get('/public/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    // Get store with owner
    const store = await prisma.store.findUnique({
      where: { slug },
      include: {
        owner: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!store || !store.isPublic) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // Get store products separately with proper relations
    const storeProducts = await prisma.storeProduct.findMany({
      where: { storeId: store.id },
      include: {
        product: true,
      },
    });

    res.json({
      store: {
        id: store.id,
        name: store.name,
        slug: store.slug,
        description: store.description,
        logo: store.logo,
        ownerName: store.owner?.name || 'Unknown',
        currency: store.currency,
        products: storeProducts.map((sp: any) => ({
          id: sp.product.id,
          name: sp.product.title,
          slug: sp.product.slug,
          description: sp.product.description,
          price: sp.customPrice || sp.product.price,
          compareAtPrice: sp.product.compareAtPrice,
          images: sp.product.imagesJson,
          category: sp.product.category,
          rating: sp.product.rating,
          reviewCount: sp.product.totalSales,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching public store:', error);
    res.status(500).json({ error: 'Failed to fetch store' });
  }
});

// GET /api/user/store/by-slug/:slug - Get store by slug (owner only, no public requirement)
router.get('/by-slug/:slug', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { slug } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Get store
    const store = await prisma.store.findUnique({
      where: { slug },
    });

    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // Only allow owner to access
    if (store.ownerId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get store products separately
    const storeProducts = await prisma.storeProduct.findMany({
      where: { storeId: store.id },
      include: {
        product: true,
      },
    });

    res.json({
      store: {
        id: store.id,
        name: store.name,
        slug: store.slug,
        description: store.description,
        logo: store.logo,
        isPublic: store.isPublic,
        currency: store.currency,
        products: storeProducts.map((sp: any) => ({
          id: sp.product.id,
          name: sp.product.title,
          slug: sp.product.slug,
          description: sp.product.description,
          price: sp.customPrice || sp.product.price,
          compareAtPrice: sp.product.compareAtPrice,
          images: sp.product.imagesJson,
          category: sp.product.category,
          rating: sp.product.rating,
          reviewCount: sp.product.totalSales,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching store by slug:', error);
    res.status(500).json({ error: 'Failed to fetch store' });
  }
});

export default router;
