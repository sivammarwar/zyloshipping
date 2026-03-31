import { Router, Response } from 'express';
import { prisma } from '../db/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createSocialAccountSchema,
  updateSocialAccountSchema,
  generatePostSchema,
  createCampaignSchema,
  updateCampaignSchema
} from '../schemas/socialMedia.schema';
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

router.post('/accounts', validate(createSocialAccountSchema), async (req: AuthRequest, res: Response) => {
  try {
    const data = req.body;

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

router.put('/accounts/:id', validate(updateSocialAccountSchema), async (req: AuthRequest, res: Response) => {
  try {
    const account = await prisma.socialMediaAccount.update({
      where: { id: req.params.id },
      data: req.body,
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

router.post('/posts/generate', validate(generatePostSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { productIds, platform, contentStyle, count } = req.body;

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

router.post('/campaigns', validate(createCampaignSchema), async (req: AuthRequest, res: Response) => {
  try {
    const data = req.body;
    const campaign = await prisma.socialMediaCampaign.create({
      data: {
        ...data,
        endDate: data.endDate || undefined,
      },
    });

    res.status(201).json({ campaign, message: 'Campaign created successfully' });
  } catch (error) {
    console.error('[Social Media] Create campaign failed:', error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

router.put('/campaigns/:id', validate(updateCampaignSchema), async (req: AuthRequest, res: Response) => {
  try {
    const campaign = await prisma.socialMediaCampaign.update({
      where: { id: req.params.id },
      data: req.body,
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
