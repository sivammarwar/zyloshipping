import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { runReviewReputationAgent } from '../agents/reviewReputation.agent';

const router = Router();

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    productId: z.string(),
    rating: z.number().min(1).max(5),
    text: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const review = await prisma.review.create({
    data: {
      productId: parsed.data.productId,
      userId: req.user!.id,
      rating: parsed.data.rating,
      text: parsed.data.text,
    },
  });

  try {
    const aiReply = await runReviewReputationAgent({ reviewId: review.id });
    if (aiReply) {
      await prisma.review.update({
        where: { id: review.id },
        data: { aiReply, aiRepliedAt: new Date() },
      });
    }
  } catch { /* optional AI */ }

  const updated = await prisma.review.findUnique({ where: { id: review.id } });
  res.status(201).json({ review: updated });
});

router.get('/:productId', async (req, res: Response) => {
  const reviews = await prisma.review.findMany({
    where: { productId: req.params.productId },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ reviews });
});

export default router;
