'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCompare } from '@/context/CompareContext';

// ── Types ─────────────────────────────────────────────────────
export interface ProductCardData {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  rating: number;       // 1–5
  reviewCount: number;
  badge?: string;       // e.g. "Bestseller", "New", "Sale"
  featured?: boolean;   // spans 2 columns
  imageUrl?: string;    // optional real image
}

interface Props {
  product: ProductCardData;
  delayClass?: string;
  currency?: string;
  currencySymbol?: string;
}

// ── SVG placeholder icons (rotate through 5 types) ───────────
const PLACEHOLDER_ICONS: Record<number, React.ReactNode> = {
  0: (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" width="64" height="64">
      <rect x="8" y="16" width="48" height="36" rx="3" fill="#fdf0f2" stroke="#C41E3A" strokeWidth="1.5" />
      <path d="M22 16V13a10 10 0 0 1 20 0v3" stroke="#C41E3A" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="32" cy="34" r="5" fill="#C41E3A" opacity="0.25" />
      <circle cx="32" cy="34" r="2.5" fill="#C41E3A" />
    </svg>
  ),
  1: (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" width="64" height="64">
      <circle cx="32" cy="28" r="14" fill="none" stroke="#C41E3A" strokeWidth="1.5" />
      <path d="M32 14v3M32 39v3M18 28h-3M47 28h3" stroke="#C41E3A" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="32" cy="28" r="5" fill="#C41E3A" opacity="0.2" />
      <path d="M22 46h20M27 46v3h10v-3" stroke="#C41E3A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  2: (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" width="64" height="64">
      <rect x="18" y="12" width="28" height="38" rx="4" fill="none" stroke="#C41E3A" strokeWidth="1.5" />
      <circle cx="32" cy="44" r="2.5" fill="#C41E3A" opacity="0.4" />
      <rect x="24" y="20" width="16" height="14" rx="2" fill="#C41E3A" opacity="0.12" />
      <path d="M26 27h12M29 24v6" stroke="#C41E3A" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  3: (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" width="64" height="64">
      <path d="M32 10C20 10 12 20 12 30c0 12 10 22 20 22s20-10 20-22C52 20 44 10 32 10z" fill="none" stroke="#C41E3A" strokeWidth="1.5" />
      <path d="M22 30c0-5.5 4.5-10 10-10s10 4.5 10 10-4.5 10-10 10" stroke="#C41E3A" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="32" cy="30" r="3" fill="#C41E3A" opacity="0.3" />
    </svg>
  ),
  4: (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" width="64" height="64">
      <path d="M16 48L32 16l16 32H16z" fill="none" stroke="#C41E3A" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M24 36h16" stroke="#C41E3A" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="32" cy="27" r="2" fill="#C41E3A" opacity="0.4" />
    </svg>
  ),
};

// ── Star renderer ─────────────────────────────────────────────
function Stars({ rating }: { rating: number }) {
  return (
    <span style={{ color: 'var(--red)', fontSize: '0.7rem', letterSpacing: '1px' }}>
      {Array.from({ length: 5 }, (_, i) => (i < rating ? '★' : '☆')).join('')}
    </span>
  );
}

// ── ProductCard ───────────────────────────────────────────────
export default function ProductCard({
  product,
  delayClass = '',
  currency = 'USD',
  currencySymbol = '$',
}: Props) {
  const [added, setAdded]           = useState(false);
  const [hovered, setHovered]       = useState(false);
  const [atMax, setAtMax]           = useState(false);
  const { toggle, isSelected, isAtMax } = useCompare();
  const selected = isSelected(product.id);

  const iconIndex = parseInt(product.id, 10) % 5 || 0;

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    if (added) return;
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  }

  function handleCompare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!selected && isAtMax) {
      setAtMax(true);
      setTimeout(() => setAtMax(false), 1600);
      return;
    }
    toggle(product);
  }

  return (
    <Link
      href={`/products/${product.slug}`}
      className={`reveal ${delayClass}`}
      style={{
        position: 'relative',
        background: 'var(--off-white)',
        border: `1px solid ${hovered ? 'var(--red-mid)' : 'var(--border)'}`,
        borderRadius: 4,
        overflow: 'hidden',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        textDecoration: 'none',
        transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
        boxShadow: hovered ? '0 20px 50px rgba(0,0,0,0.1)' : 'none',
        transition: 'transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.28s ease, border-color 0.2s',
        ...(product.featured ? { gridColumn: 'span 2' } : {}),
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Product image area */}
      <div
        style={{
          background: 'var(--red-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          aspectRatio: product.featured ? '2/1' : '1',
        }}
      >
        {/* Badge */}
        {product.badge && (
          <div
            style={{
              position: 'absolute',
              top: '0.75rem',
              left: '0.75rem',
              background: 'var(--red)',
              color: 'var(--white)',
              fontSize: '0.65rem',
              fontWeight: 500,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              padding: '0.25rem 0.55rem',
              borderRadius: 1,
              zIndex: 2,
            }}
          >
            {product.badge}
          </div>
        )}

        {/* Discount % badge */}
        {discount > 0 && (
          <div
            style={{
              position: 'absolute',
              top: product.badge ? '2.25rem' : '0.75rem',
              left: '0.75rem',
              background: 'var(--ink)',
              color: 'var(--white)',
              fontSize: '0.6rem',
              fontWeight: 500,
              letterSpacing: '0.04em',
              padding: '0.2rem 0.45rem',
              borderRadius: 1,
              zIndex: 2,
            }}
          >
            -{discount}%
          </div>
        )}

        {/* Image or placeholder icon */}
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              opacity: 0.45,
              width: product.featured ? 90 : 64,
              height: product.featured ? 90 : 64,
            }}
          >
            {PLACEHOLDER_ICONS[iconIndex]}
          </div>
        )}

        {/* Hover overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(196,30,58,0.04)',
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.2s',
          }}
        />
      </div>

      {/* Card body */}
      <div
        style={{
          padding: '1rem 1.1rem 1.2rem',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Category */}
        <div
          style={{
            fontSize: '0.65rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--ink-faint)',
            marginBottom: '0.3rem',
          }}
        >
          {product.category}
        </div>

        {/* Name */}
        <div
          style={{
            fontFamily: 'var(--serif)',
            fontSize: '1rem',
            fontWeight: 700,
            color: 'var(--ink)',
            marginBottom: '0.5rem',
            lineHeight: 1.3,
          }}
        >
          {product.name}
        </div>

        {/* Rating */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.75rem' }}>
          <Stars rating={product.rating} />
          <span style={{ fontSize: '0.7rem', color: 'var(--ink-faint)' }}>
            ({product.reviewCount.toLocaleString()})
          </span>
        </div>

        {/* Price + Add button */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 'auto',
          }}
        >
          <div>
            <span
              style={{
                fontFamily: 'var(--serif)',
                fontSize: '1.2rem',
                fontWeight: 700,
                color: 'var(--red)',
              }}
            >
              {currencySymbol}{product.price.toFixed(2)}
            </span>
            {product.originalPrice && (
              <span
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--ink-faint)',
                  textDecoration: 'line-through',
                  marginLeft: '0.4rem',
                  fontWeight: 300,
                }}
              >
                {currencySymbol}{product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>

          {/* Add to cart button */}
          <button
            onClick={handleAdd}
            aria-label="Add to cart"
            style={{
              width: 32,
              height: 32,
              background: added ? 'var(--red-deep)' : 'var(--red)',
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s, transform 0.2s',
              transform: added ? 'scale(1.1)' : 'scale(1)',
              flexShrink: 0,
            }}
          >
            {added ? (
              /* Checkmark */
              <svg viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                <path d="M2 7l3.5 3.5L12 4" />
              </svg>
            ) : (
              /* Plus */
              <svg viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" width="14" height="14">
                <path d="M7 2v10M2 7h10" />
              </svg>
            )}
          </button>
        </div>

        {/* Free shipping indicator */}
        {product.price >= 49 && (
          <div
            style={{
              fontSize: '0.65rem',
              color: '#16a34a',
              marginTop: '0.5rem',
              fontWeight: 400,
            }}
          >
            ✓ Free shipping
          </div>
        )}

        {/* Compare toggle */}
        <button
          onClick={handleCompare}
          aria-label={selected ? 'Remove from comparison' : 'Add to comparison'}
          style={{
            marginTop: '0.6rem',
            width: '100%',
            padding: '0.35rem 0',
            background: selected ? 'var(--ink)' : 'transparent',
            border: `1px solid ${selected ? 'var(--ink)' : atMax ? 'var(--red)' : 'var(--border)'}`,
            borderRadius: 2,
            cursor: 'pointer',
            fontSize: '0.68rem',
            fontWeight: selected ? 500 : 400,
            letterSpacing: '0.05em',
            color: selected ? 'var(--white)' : atMax ? 'var(--red)' : 'var(--ink-faint)',
            fontFamily: 'var(--sans)',
            transition: 'all 0.18s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.3rem',
          }}
        >
          {atMax ? (
            'Max 3 reached'
          ) : selected ? (
            <>
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="10" height="10"><path d="M2 6h8" /></svg>
              Remove
            </>
          ) : (
            <>
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="10" height="10"><path d="M6 2v8M2 6h8" /></svg>
              Compare
            </>
          )}
        </button>
      </div>
    </Link>
  );
}