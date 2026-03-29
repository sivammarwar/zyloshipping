'use client';

import { useState } from 'react';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function StarRating({
  rating,
  onRatingChange,
  readonly = false,
  size = 'md',
}: StarRatingProps) {
  const [hover, setHover] = useState(0);

  const px = { sm: 14, md: 18, lg: 24 }[size];

  return (
    <div className="flex gap-0.5" style={{ lineHeight: 1 }}>
      {[1, 2, 3, 4, 5].map((v) => {
        const filled = v <= (hover || rating);
        return (
          <button
            key={v}
            type="button"
            disabled={readonly}
            onClick={() => !readonly && onRatingChange?.(v)}
            onMouseEnter={() => !readonly && setHover(v)}
            onMouseLeave={() => !readonly && setHover(0)}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: readonly ? 'default' : 'pointer',
              color: filled ? 'var(--red)' : 'var(--border)',
              fontSize: px,
              transition: 'color 0.12s, transform 0.1s',
              transform: !readonly && hover === v ? 'scale(1.2)' : 'scale(1)',
            }}
            aria-label={`${v} star`}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}