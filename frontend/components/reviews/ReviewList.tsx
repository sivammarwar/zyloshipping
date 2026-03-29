'use client';

import { useState, useEffect, useCallback } from 'react';
import { StarRating } from './StarRating';
import { ReviewForm } from './ReviewForm';
import { getReviews } from '@/lib/api/reviews';
import { getUserFromToken } from '@/lib/tokenManager';
import type { Review, ReviewsResponse } from '@/types/review';

interface ReviewListProps {
  productId: string;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months === 1) return '1 month ago';
  if (months < 12) return `${months} months ago`;
  return `${Math.floor(months / 12)} year(s) ago`;
}

export function ReviewList({ productId }: ReviewListProps) {
  const [data, setData]           = useState<ReviewsResponse | null>(null);
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(1);
  const [showForm, setShowForm]   = useState(false);
  const isLoggedIn                = Boolean(getUserFromToken());

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await getReviews(productId, p);
      setData(res);
      setPage(p);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => { load(1); }, [load]);

  const handleReviewSuccess = () => {
    setShowForm(false);
    load(1);
  };

  const pcts = data
    ? [5, 4, 3, 2, 1].map(s => ({
        star: s,
        pct: data.totalReviews
          ? Math.round(((data.ratingBreakdown[String(s)] || 0) / data.totalReviews) * 100)
          : 0,
      }))
    : [];

  return (
    <section style={{ padding: '4rem 4vw', background: 'var(--white)', borderTop: '1px solid var(--border)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--red)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ display: 'inline-block', width: 16, height: 1, background: 'var(--red)' }} />
              Customer Reviews
            </div>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--ink)' }}>
              {data ? `${data.avgRating.toFixed(1)} / 5 · ${data.totalReviews.toLocaleString()} reviews` : 'Reviews'}
            </h2>
          </div>

          {isLoggedIn ? (
            <button
              onClick={() => setShowForm(v => !v)}
              style={{ background: 'var(--red)', color: 'var(--white)', border: 'none', borderRadius: 2, padding: '0.65rem 1.4rem', fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--sans)', transition: 'background 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--red-deep)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--red)'}
            >
              {showForm ? 'Cancel' : 'Write a review'}
            </button>
          ) : (
            <span style={{ fontSize: '0.78rem', color: 'var(--ink-faint)' }}>
              <a href="/login" style={{ color: 'var(--red)' }}>Sign in</a> to leave a review
            </span>
          )}
        </div>

        {/* Review form */}
        {showForm && (
          <div style={{ marginBottom: '2.5rem' }}>
            <ReviewForm
              productId={productId}
              onSuccess={handleReviewSuccess}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        {data && data.totalReviews > 0 && (
          <>
            {/* Rating summary */}
            <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '3rem', marginBottom: '3rem', alignItems: 'start' }}>
              <div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: '3rem', fontWeight: 900, color: 'var(--ink)', lineHeight: 1 }}>
                  {data.avgRating.toFixed(1)}
                </div>
                <StarRating rating={Math.round(data.avgRating)} readonly size="md" />
                <div style={{ fontSize: '0.75rem', color: 'var(--ink-faint)', marginTop: '0.4rem' }}>
                  {data.totalReviews.toLocaleString()} reviews
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {pcts.map(({ star, pct }) => (
                  <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', width: 8, flexShrink: 0 }}>{star}</span>
                    <span style={{ color: 'var(--red)', fontSize: '0.7rem' }}>★</span>
                    <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: 'var(--red)', borderRadius: 3, transition: 'width 0.4s ease' }} />
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--ink-faint)', width: 30, textAlign: 'right', flexShrink: 0 }}>{pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Review cards */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--ink-faint)', fontSize: '0.88rem' }}>Loading…</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {data.reviews.map((r: Review) => (
                  <div key={r.id} style={{ padding: '1.5rem', border: '1px solid var(--border)', borderRadius: 4, background: 'var(--off-white)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--serif)', fontSize: '0.85rem', fontWeight: 700, color: 'var(--white)', flexShrink: 0 }}>
                          {r.userName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--ink)' }}>{r.userName}</div>
                          {r.isVerifiedPurchase && (
                            <div style={{ fontSize: '0.68rem', color: '#16a34a', fontWeight: 500 }}>✓ Verified purchase</div>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <StarRating rating={r.rating} readonly size="sm" />
                        <span style={{ fontSize: '0.72rem', color: 'var(--ink-faint)' }}>{timeAgo(r.createdAt)}</span>
                      </div>
                    </div>

                    {r.title && (
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--ink)', marginBottom: '0.35rem' }}>{r.title}</div>
                    )}
                    {r.text && (
                      <p style={{ fontSize: '0.88rem', color: 'var(--ink-muted)', lineHeight: 1.7, fontWeight: 300, margin: 0 }}>{r.text}</p>
                    )}

                    {/* AI reply */}
                    {r.aiReply && (
                      <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '0.35rem' }}>
                          Response from ZyloShipping
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', lineHeight: 1.65, fontWeight: 300, margin: 0 }}>{r.aiReply}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {data.pagination.totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
                {Array.from({ length: data.pagination.totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => load(p)}
                    style={{
                      width: 34, height: 34, borderRadius: 2,
                      border: `1.5px solid ${p === page ? 'var(--red)' : 'var(--border)'}`,
                      background: p === page ? 'var(--red)' : 'none',
                      color: p === page ? 'var(--white)' : 'var(--ink-muted)',
                      fontSize: '0.82rem', fontWeight: p === page ? 500 : 300,
                      cursor: 'pointer', fontFamily: 'var(--sans)',
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {data && data.totalReviews === 0 && !showForm && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--ink-faint)', fontSize: '0.88rem' }}>
            No reviews yet. Be the first to share your experience.
          </div>
        )}
      </div>
    </section>
  );
}