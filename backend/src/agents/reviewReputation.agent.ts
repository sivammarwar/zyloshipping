import { prisma } from '../db/prisma';
import { invokeGpt4o } from './llm';

export async function runReviewReputationAgent(input: { reviewId: string }) {
  const review = await prisma.review.findUnique({
    where: { id: input.reviewId },
    include: { product: { select: { title: true } }, user: { select: { name: true } } },
  });
  if (!review) return null;

  const { text } = await invokeGpt4o(
    'review_reputation',
    'Write a short, friendly public reply from the brand to this product review.',
    JSON.stringify({
      product: review.product.title,
      rating: review.rating,
      text: review.text,
    })
  );
  return text;
}
