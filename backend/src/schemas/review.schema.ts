import { z } from 'zod';

export const createReviewSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  rating: z.number()
    .int('Rating must be a whole number')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5'),
  title: z.string().max(100, 'Title too long').optional(),
  text: z.string().max(1000, 'Review text too long').optional()
});
