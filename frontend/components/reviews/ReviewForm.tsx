'use client';

import { useState } from 'react';
import { StarRating } from './StarRating';
import { submitReview } from '@/lib/api/reviews';

interface ReviewFormProps {
  productId: string;
  onSuccess: () => void;
  onCancel?: () => void;
}

export function ReviewForm({ productId, onSuccess, onCancel }: ReviewFormProps) {
  const [rating, setRating]       = useState(0);
  const [title, setTitle]         = useState('');
  const [text, setText]           = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) { setError('Please select a star rating.'); return; }
    setSubmitting(true);
    setError('');
    try {
      await submitReview({
        productId,
        rating,
        title: title || undefined,
        text: text || undefined,
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: 'var(--white)',
        border: '1px solid var(--border)',
        borderRadius: 4,
        padding: '1.75rem',
      }}
    >
      <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '1.25rem' }}>
        Write a Review
      </h3>

      {/* Rating */}
      <div style={{ marginBottom: '1.1rem' }}>
        <label style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-faint)', display: 'block', marginBottom: '0.5rem' }}>
          Rating *
        </label>
        <StarRating rating={rating} onRatingChange={setRating} size="lg" />
      </div>

      {/* Title */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-faint)', display: 'block', marginBottom: '0.4rem' }}>
          Title (optional)
        </label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          maxLength={100}
          placeholder="Sum up your experience"
          style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1.5px solid var(--border)', borderRadius: 2, fontSize: '0.88rem', fontFamily: 'var(--sans)', color: 'var(--ink)', background: 'var(--white)', outline: 'none', boxSizing: 'border-box' }}
          onFocus={e => e.currentTarget.style.borderColor = 'var(--red)'}
          onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
        />
      </div>

      {/* Review text */}
      <div style={{ marginBottom: '1.25rem' }}>
        <label style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-faint)', display: 'block', marginBottom: '0.4rem' }}>
          Review (optional)
        </label>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          maxLength={1000}
          rows={4}
          placeholder="Share your thoughts about this product…"
          style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1.5px solid var(--border)', borderRadius: 2, fontSize: '0.88rem', fontFamily: 'var(--sans)', color: 'var(--ink)', background: 'var(--white)', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
          onFocus={e => e.currentTarget.style.borderColor = 'var(--red)'}
          onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
        />
        <div style={{ fontSize: '0.7rem', color: 'var(--ink-faint)', textAlign: 'right', marginTop: '0.25rem' }}>
          {text.length}/1000
        </div>
      </div>

      {error && (
        <div style={{ padding: '0.65rem 0.85rem', background: 'var(--red-light)', border: '1px solid var(--red-mid)', borderRadius: 2, fontSize: '0.82rem', color: 'var(--red)', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button
          type="submit"
          disabled={submitting || rating === 0}
          style={{
            flex: 1,
            padding: '0.75rem 1.5rem',
            background: submitting || rating === 0 ? 'var(--border)' : 'var(--red)',
            color: 'var(--white)',
            border: 'none',
            borderRadius: 2,
            fontSize: '0.88rem',
            fontWeight: 500,
            cursor: submitting || rating === 0 ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--sans)',
            transition: 'background 0.2s',
          }}
        >
          {submitting ? 'Submitting…' : 'Submit Review'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            style={{ padding: '0.75rem 1.2rem', background: 'none', border: '1px solid var(--border)', borderRadius: 2, fontSize: '0.85rem', color: 'var(--ink-muted)', cursor: 'pointer', fontFamily: 'var(--sans)' }}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}