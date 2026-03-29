import { ensureValidToken } from '@/lib/tokenManager';
import type { ReviewsResponse, SubmitReviewPayload } from '@/types/review';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

export async function getReviews(
  productId: string,
  page = 1,
  limit = 10,
): Promise<ReviewsResponse> {
  const res = await fetch(
    `${BASE}/api/reviews/${productId}?page=${page}&limit=${limit}`,
    { cache: 'no-store' },
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch reviews: ${res.status}`);
  }

  return res.json() as Promise<ReviewsResponse>;
}

export async function submitReview(payload: SubmitReviewPayload): Promise<void> {
  const token = await ensureValidToken();

  if (!token) {
    throw new Error('You must be signed in to submit a review.');
  }

  const res = await fetch(`${BASE}/api/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { message?: string }).message ?? `Submit failed: ${res.status}`,
    );
  }
}