import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { generateProductContent, getTrendingProducts } from '../services/social/contentGenerator.service';
import { instagramService } from '../services/social/instagram.service';
import { facebookService } from '../services/social/facebook.service';
import { twitterService } from '../services/social/twitter.service';

const router = Router();

// ═══════════════════════════════════════════════════════════════
// SOCIAL MEDIA ACCOUNTS
// ═══════════════════════════════════════════════════════════════

router.get('/accounts', async (req: AuthRequest, res: Response) => {
  try {
    const accounts = await prisma.socialMediaAccount.findMany({
      orderBy: { createdAt: 'desc' },
    });

    res.json({ accounts });
  } catch (error) {
    console.error('[Social Media] Get accounts failed:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

router.post('/accounts', async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    platform: z.enum(['INSTAGRAM', 'FACEBOOK', 'TWITTER']),
    accountName: z.string().min(1),
    accountHandle: z.string().min(1),
    accountId: z.string().optional(),
    accessToken: z.string().min(1),
    refreshToken: z.string().optional(),
    targetRegion: z.string().default('US'),
    postingTimezone: z.string().default('America/New_York'),
    postsPerDay: z.number().int().min(1).max(10).default(3),
  });

  try {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    }

    const data = parsed.data;

    // Check if account already exists
    const existing = await prisma.socialMediaAccount.findFirst({
      where: {
        platform: data.platform,
        accountHandle: data.accountHandle,
      },
    });

    if (existing) {
      return res.status(409).json({ error: 'Account already connected' });
    }

    // Create account
    const account = await prisma.socialMediaAccount.create({
      data: {
        platform: data.platform,
        accountName: data.accountName,
        accountHandle: data.accountHandle,
        accountId: data.accountId,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        targetRegion: data.targetRegion,
        postingTimezone: data.postingTimezone,
        postsPerDay: data.postsPerDay,
        postingTimes: ['17:30', '22:30', '04:30'], // Default US optimal times
      },
    });

    res.status(201).json({ account, message: 'Account connected successfully' });
  } catch (error) {
    console.error('[Social Media] Create account failed:', error);
    res.status(500).json({ error: 'Failed to connect account' });
  }
});

router.put('/accounts/:id', async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    isActive: z.boolean().optional(),
    targetRegion: z.string().optional(),
    postingTimezone: z.string().optional(),
    postingTimes: z.array(z.string()).optional(),
    postsPerDay: z.number().int().min(1).max(10).optional(),
  });

  try {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    }

    const account = await prisma.socialMediaAccount.update({
      where: { id: req.params.id },
      data: parsed.data,
    });

    res.json({ account, message: 'Account updated successfully' });
  } catch (error) {
    console.error('[Social Media] Update account failed:', error);
    res.status(500).json({ error: 'Failed to update account' });
  }
});

router.delete('/accounts/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.socialMediaAccount.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Account disconnected successfully' });
  } catch (error) {
    console.error('[Social Media] Delete account failed:', error);
    res.status(500).json({ error: 'Failed to disconnect account' });
  }
});

// ═══════════════════════════════════════════════════════════════
// SOCIAL MEDIA POSTS
// ═══════════════════════════════════════════════════════════════

router.get('/posts', async (req: AuthRequest, res: Response) => {
  try {
    const platform = req.query.platform as string | undefined;
    const status = req.query.status as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const where: any = {};
    if (platform) where.platform = platform;
    if (status) where.status = status;

    const [posts, total] = await Promise.all([
      prisma.socialMediaPost.findMany({
        where,
        include: {
          account: { select: { platform: true, accountHandle: true } },
          campaign: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.socialMediaPost.count({ where }),
    ]);

    res.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[Social Media] Get posts failed:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

router.get('/posts/:id', async (req: AuthRequest, res: Response) => {
  try {
    const post = await prisma.socialMediaPost.findUnique({
      where: { id: req.params.id },
      include: {
        account: true,
        campaign: true,
      },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({ post });
  } catch (error) {
    console.error('[Social Media] Get post failed:', error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

router.post('/posts/generate', async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    productIds: z.array(z.string()).optional(),
    platform: z.enum(['INSTAGRAM', 'FACEBOOK', 'TWITTER']),
    contentStyle: z.enum(['VIRAL_HOOK', 'EDUCATIONAL', 'PROMOTIONAL', 'STORYTELLING', 'TRENDING', 'CONTROVERSIAL']).default('VIRAL_HOOK'),
    count: z.number().int().min(1).max(10).default(5),
  });

  try {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    }

    const { productIds, platform, contentStyle, count } = parsed.data;

    // Get products
    let products;
    if (productIds && productIds.length > 0) {
      products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: {
          id: true,
          title: true,
          price: true,
          category: true,
          rating: true,
          totalSales: true,
          imagesJson: true,
        },
      });
    } else {
      products = await getTrendingProducts(count);
    }

    // Generate content for each product
    const generatedPosts = [];
    for (const product of products) {
      const content = await generateProductContent(
        {
          ...product,
          images: Array.isArray((product as any).imagesJson) ? (product as any).imagesJson as string[] : [],
        },
        platform,
        contentStyle
      );

      generatedPosts.push({
        product,
        content,
      });
    }

    res.json({ posts: generatedPosts });
  } catch (error) {
    console.error('[Social Media] Generate content failed:', error);
    res.status(500).json({ error: 'Failed to generate content' });
  }
});

router.delete('/posts/:id', async (req: AuthRequest, res: Response) => {
  try {
    const post = await prisma.socialMediaPost.findUnique({
      where: { id: req.params.id },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // If published, try to delete from platform
    if (post.status === 'PUBLISHED' && post.platformPostId) {
      // Platform-specific deletion logic here
    }

    await prisma.socialMediaPost.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('[Social Media] Delete post failed:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// ═══════════════════════════════════════════════════════════════
// CAMPAIGNS
// ═══════════════════════════════════════════════════════════════

router.get('/campaigns', async (req: AuthRequest, res: Response) => {
  try {
    const campaigns = await prisma.socialMediaCampaign.findMany({
      include: {
        account: { select: { platform: true, accountHandle: true } },
        _count: { select: { posts: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ campaigns });
  } catch (error) {
    console.error('[Social Media] Get campaigns failed:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

router.post('/campaigns', async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    accountId: z.string().min(1),
    name: z.string().min(1),
    description: z.string().optional(),
    targetRegion: z.string().default('US'),
    contentStyle: z.enum(['VIRAL_HOOK', 'EDUCATIONAL', 'PROMOTIONAL', 'STORYTELLING', 'TRENDING', 'CONTROVERSIAL']).default('VIRAL_HOOK'),
    postsPerDay: z.number().int().min(1).max(10).default(3),
    productCount: z.number().int().min(1).max(20).default(10),
    startDate: z.string().transform(str => new Date(str)),
    endDate: z.string().optional().transform(str => str ? new Date(str) : null),
  });

  try {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    }

    const campaign = await prisma.socialMediaCampaign.create({
      data: {
        ...parsed.data,
        endDate: parsed.data.endDate || undefined,
      },
    });

    res.status(201).json({ campaign, message: 'Campaign created successfully' });
  } catch (error) {
    console.error('[Social Media] Create campaign failed:', error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

router.put('/campaigns/:id', async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
    contentStyle: z.enum(['VIRAL_HOOK', 'EDUCATIONAL', 'PROMOTIONAL', 'STORYTELLING', 'TRENDING', 'CONTROVERSIAL']).optional(),
    postsPerDay: z.number().int().min(1).max(10).optional(),
  });

  try {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    }

    const campaign = await prisma.socialMediaCampaign.update({
      where: { id: req.params.id },
      data: parsed.data,
    });

    res.json({ campaign, message: 'Campaign updated successfully' });
  } catch (error) {
    console.error('[Social Media] Update campaign failed:', error);
    res.status(500).json({ error: 'Failed to update campaign' });
  }
});

// ═══════════════════════════════════════════════════════════════
// ANALYTICS
// ═══════════════════════════════════════════════════════════════

router.get('/analytics', async (req: AuthRequest, res: Response) => {
  try {
    const platform = req.query.platform as string | undefined;
    const days = parseInt(req.query.days as string) || 30;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const where: any = { date: { gte: startDate } };
    if (platform) where.platform = platform;

    const analytics = await prisma.socialMediaAnalytics.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    // Aggregate totals
    const totals = analytics.reduce(
      (acc, day) => ({
        postsPublished: acc.postsPublished + day.postsPublished,
        totalViews: acc.totalViews + day.totalViews,
        totalLikes: acc.totalLikes + day.totalLikes,
        totalComments: acc.totalComments + day.totalComments,
        totalShares: acc.totalShares + day.totalShares,
        totalReach: acc.totalReach + day.totalReach,
        followersGained: acc.followersGained + day.followersGained,
      }),
      {
        postsPublished: 0,
        totalViews: 0,
        totalLikes: 0,
        totalComments: 0,
        totalShares: 0,
        totalReach: 0,
        followersGained: 0,
      }
    );

    res.json({ analytics, totals });
  } catch (error) {
    console.error('[Social Media] Get analytics failed:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

router.get('/analytics/top-posts', async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const days = parseInt(req.query.days as string) || 30;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const topPosts = await prisma.socialMediaPost.findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: { gte: startDate },
      },
      orderBy: { engagement: 'desc' },
      take: limit,
      include: {
        account: { select: { platform: true, accountHandle: true } },
      },
    });

    res.json({ topPosts });
  } catch (error) {
    console.error('[Social Media] Get top posts failed:', error);
    res.status(500).json({ error: 'Failed to fetch top posts' });
  }
});

export default router;
