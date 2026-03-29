import { prisma } from '../db/prisma';
import { invokeGpt4o } from './llm';

const TONE: Record<number, string> = {
  5: 'enthusiastic and genuinely grateful',
  4: 'warm and appreciative',
  3: 'understanding — ask what we could improve',
  2: 'apologetic — offer to make it right',
  1: 'very apologetic — offer refund or replacement',
};

export async function generateReviewReply(reviewId: string): Promise<void> {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: { product: { select: { title: true } } },
  });

  if (!review) {
    console.error('[ReviewAgent] Review not found:', reviewId);
    return;
  }

  const prompt = `You are a friendly customer service rep for ZyloShipping.
Write a SHORT reply (max 80 words) to this product review.

Product: ${review.product.title}
Rating: ${review.rating}/5 stars
Review: "${review.text || 'No text provided'}"

Tone: Be ${TONE[review.rating] ?? 'professional and helpful'}.

Rules:
- Reference the product by name
- Be genuine and human, not robotic
- End with an invitation to shop again
- Never open with "Thank you for your feedback"
- Keep it under 80 words`;

  try {
    const { text } = await invokeGpt4o(
      'review_reply',
      'You are a helpful customer service representative for an e-commerce store.',
      prompt
    );

    await prisma.review.update({
      where: { id: reviewId },
      data: { aiReply: text, aiRepliedAt: new Date() },
    });

    console.log(`[ReviewAgent] Reply generated for review ${reviewId}`);
  } catch (e) {
    console.error('[ReviewAgent] Generation failed:', e);
  }
}