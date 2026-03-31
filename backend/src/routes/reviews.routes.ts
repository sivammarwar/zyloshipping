import { Router, Response } from 'express';
import { prisma } from '../db/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createReviewSchema } from '../schemas/review.schema';

const router = Router();

// ── POST /api/reviews ──────────────────────────────────────────
router.post('/', authMiddleware, validate(createReviewSchema), async (req: AuthRequest, res: Response) => {
  const { productId, rating, title, text } = req.body;
  const userId = req.user!.id;

  try {
    // Check existing review
    const existing = await prisma.review.findFirst({ where: { productId, userId } });
    if (existing) {
      return res.status(400).json({ error: 'You have already reviewed this product.' });
    }

    // Create review
    const review = await prisma.review.create({
      data: { productId, userId, rating, text },
    });

    // Update product avg rating
    const agg = await prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.product.update({
      where: { id: productId },
      data: {
        rating:     agg._avg.rating ?? 0,
        totalSales: undefined, // don't touch totalSales
      },
    });

    // Async AI reply generation
    setImmediate(async () => {
      try {
        const { generateReviewReply } = await import('../agents/reviewReputation.agent');
        await generateReviewReply(review.id);
      } catch (e) {
        console.error('[Review] AI reply failed:', e);
      }
    });

    res.status(201).json({ review, message: 'Review submitted successfully!' });
  } catch (e) {
    console.error('[Review] Error:', e);
    res.status(500).json({ error: 'Failed to submit review.' });
  }
});

// ── GET /api/reviews/:productId ────────────────────────────────
router.get('/:productId', async (req, res: Response) => {
  const { productId } = req.params;
  const page  = Math.max(1, parseInt(req.query.page as string)  || 1);
  const limit = Math.min(50, parseInt(req.query.limit as string) || 10);
  const skip  = (page - 1) * limit;

  try {
    const [reviews, total, ratingGroups, product] = await Promise.all([
      prisma.review.findMany({
        where: { productId },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.review.count({ where: { productId } }),
      prisma.review.groupBy({
        by: ['rating'],
        where: { productId },
        _count: { rating: true },
      }),
      prisma.product.findUnique({
        where: { id: productId },
        select: { rating: true, totalSales: true },
      }),
    ]);

    const breakdown: Record<string, number> = { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 };
    ratingGroups.forEach(g => { breakdown[String(g.rating)] = g._count.rating; });

    const formatted = reviews.map(r => ({
      id:                 r.id,
      rating:             r.rating,
      title:              null,           // schema has no title field — add migration if needed
      text:               r.text,
      aiReply:            r.aiReply,
      userName:           r.user.name?.split(' ')[0] || 'Anonymous',
      isVerifiedPurchase: false,          // no verified purchase check in schema — extend if needed
      createdAt:          r.createdAt,
    }));

    res.json({
      reviews:        formatted,
      avgRating:      product?.rating ?? 0,
      totalReviews:   total,
      ratingBreakdown: breakdown,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (e) {
    console.error('[Review] Fetch error:', e);
    res.status(500).json({ error: 'Failed to fetch reviews.' });
  }
});

export default router;