'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCompare } from '@/context/CompareContext';
import { ProductCardData } from '@/components/store/ProductCard';
import { addToCart } from '@/lib/api/cart';

function Stars({ rating }: { rating: number }) {
  return (
    <span style={{ color: 'var(--red)', fontSize: '0.75rem', letterSpacing: '1px' }}>
      {Array.from({ length: 5 }, (_, i) => (i < rating ? '★' : '☆')).join('')}
    </span>
  );
}

function PlaceholderImg() {
  return (
    <svg viewBox="0 0 80 80" fill="none" width="80" height="80">
      <rect x="8" y="16" width="64" height="48" rx="3" fill="var(--red-light)" stroke="var(--red-mid)" strokeWidth="1.5" />
      <circle cx="40" cy="40" r="10" fill="var(--red)" opacity="0.15" />
      <circle cx="40" cy="40" r="5" fill="var(--red)" opacity="0.35" />
    </svg>
  );
}

interface RowProps {
  label: string;
  values: (string | React.ReactNode)[];
  highlight?: boolean;
  isHeader?: boolean;
}

function CompareRow({ label, values, highlight, isHeader }: RowProps) {
  const colCount = values.length;
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `160px repeat(${colCount}, 1fr)`,
        borderBottom: '1px solid var(--border)',
        background: highlight ? 'var(--red-light)' : isHeader ? 'var(--off-white)' : 'var(--white)',
      }}
    >
      <div
        style={{
          padding: '0.85rem 1rem',
          fontSize: '0.72rem',
          fontWeight: 500,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--ink-faint)',
          display: 'flex',
          alignItems: 'center',
          borderRight: '1px solid var(--border)',
          background: 'var(--off-white)',
          position: 'sticky',
          left: 0,
          zIndex: 1,
        }}
      >
        {label}
      </div>
      {values.map((val, i) => (
        <div
          key={i}
          style={{
            padding: '0.85rem 1.25rem',
            fontSize: '0.88rem',
            color: 'var(--ink)',
            display: 'flex',
            alignItems: 'center',
            borderRight: i < values.length - 1 ? '1px solid var(--border)' : 'none',
          }}
        >
          {val}
        </div>
      ))}
    </div>
  );
}

export default function CompareModal() {
  const { items, remove, clear, closeModal, modalOpen } = useCompare();
  const [adding, setAdding]   = useState<string | null>(null);
  const [added, setAdded]     = useState<string | null>(null);

  useEffect(() => {
    if (modalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [modalOpen]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeModal();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeModal]);

  if (!modalOpen || items.length < 2) return null;

  async function handleAddToCart(p: ProductCardData) {
    if (adding) return;
    setAdding(p.id);
    try {
      await addToCart(p.id, 1);
      setAdded(p.id);
      setTimeout(() => setAdded(null), 1800);
    } catch {
      /* silent – user may not be signed in */
    } finally {
      setAdding(null);
    }
  }

  const discount = (p: ProductCardData) =>
    p.originalPrice && p.originalPrice > p.price
      ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
      : 0;

  const stockLabel = (p: ProductCardData) => {
    if (p.badge === 'Low stock') return <span style={{ color: '#d97706', fontWeight: 500 }}>Low stock</span>;
    if (p.badge === 'Out of stock') return <span style={{ color: 'var(--red)', fontWeight: 500 }}>Out of stock</span>;
    return <span style={{ color: '#16a34a', fontWeight: 500 }}>In stock</span>;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={closeModal}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.55)',
          zIndex: 120,
          backdropFilter: 'blur(3px)',
          animation: 'fadeIn 0.2s ease',
        }}
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Product comparison"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 121,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          padding: '1.5rem',
          animation: 'scaleIn 0.25s cubic-bezier(0.22,1,0.36,1)',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            background: 'var(--white)',
            borderRadius: 6,
            maxWidth: 1100,
            width: '100%',
            margin: 'auto',
            boxShadow: '0 32px 80px rgba(0,0,0,0.22)',
            overflow: 'hidden',
            pointerEvents: 'all',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '90vh',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '1.25rem 1.75rem',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
              background: 'var(--white)',
            }}
          >
            <div>
              <div style={{ fontSize: '0.65rem', fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--red)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ display: 'inline-block', width: 14, height: 1, background: 'var(--red)' }} />
                Side-by-side comparison
              </div>
              <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.4rem', fontWeight: 900, color: 'var(--ink)', letterSpacing: '-0.02em', margin: 0 }}>
                Compare Products
              </h2>
            </div>
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
              <button
                onClick={clear}
                style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', background: 'none', border: '1px solid var(--border)', borderRadius: 2, padding: '0.45rem 0.85rem', cursor: 'pointer', fontFamily: 'var(--sans)', transition: 'all 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--red)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                Clear all
              </button>
              <button
                onClick={closeModal}
                aria-label="Close comparison"
                style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--off-white)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', color: 'var(--ink-muted)', transition: 'all 0.15s', lineHeight: 1 }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--red)'; e.currentTarget.style.color = 'var(--white)'; e.currentTarget.style.borderColor = 'var(--red)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--off-white)'; e.currentTarget.style.color = 'var(--ink-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
              >
                ×
              </button>
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowY: 'auto', flex: 1, overflowX: 'auto' }}>
            {/* Product image + name + remove header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `160px repeat(${items.length}, 1fr)`,
                borderBottom: '2px solid var(--border)',
                background: 'var(--off-white)',
                position: 'sticky',
                top: 0,
                zIndex: 2,
              }}
            >
              <div style={{ padding: '1rem', background: 'var(--off-white)', borderRight: '1px solid var(--border)' }} />
              {items.map(p => (
                <div
                  key={p.id}
                  style={{
                    padding: '1.25rem',
                    textAlign: 'center',
                    borderRight: '1px solid var(--border)',
                    background: 'var(--white)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.6rem',
                  }}
                >
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <div style={{ width: 90, height: 90, borderRadius: 4, overflow: 'hidden', background: 'var(--red-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                      {p.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.imageUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <PlaceholderImg />
                      )}
                    </div>
                    <button
                      onClick={() => remove(p.id)}
                      aria-label={`Remove ${p.name}`}
                      style={{ position: 'absolute', top: -7, right: -7, width: 22, height: 22, borderRadius: '50%', background: 'var(--ink)', border: '2px solid var(--white)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--white)', fontSize: '0.7rem', lineHeight: 1, transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--red)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'var(--ink)'}
                    >
                      ×
                    </button>
                  </div>
                  <Link
                    href={`/products/${p.slug}`}
                    onClick={closeModal}
                    style={{ fontFamily: 'var(--serif)', fontSize: '0.88rem', fontWeight: 700, color: 'var(--ink)', textDecoration: 'none', lineHeight: 1.3, textAlign: 'center' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--ink)'}
                  >
                    {p.name}
                  </Link>
                  {p.badge && (
                    <span style={{ fontSize: '0.6rem', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '0.2rem 0.5rem', background: 'var(--red)', color: 'var(--white)', borderRadius: 1 }}>
                      {p.badge}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Data rows */}
            <CompareRow
              label="Price"
              highlight
              values={items.map(p => (
                <div>
                  <span style={{ fontFamily: 'var(--serif)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--red)' }}>
                    ${p.price.toFixed(2)}
                  </span>
                  {p.originalPrice && (
                    <span style={{ fontSize: '0.78rem', color: 'var(--ink-faint)', textDecoration: 'line-through', marginLeft: '0.4rem' }}>
                      ${p.originalPrice.toFixed(2)}
                    </span>
                  )}
                </div>
              ))}
            />

            <CompareRow
              label="Discount"
              values={items.map(p => {
                const d = discount(p);
                return d > 0
                  ? <span style={{ background: 'var(--ink)', color: 'var(--white)', fontSize: '0.72rem', fontWeight: 500, padding: '0.2rem 0.45rem', borderRadius: 1 }}>−{d}%</span>
                  : <span style={{ color: 'var(--ink-faint)', fontSize: '0.82rem' }}>—</span>;
              })}
            />

            <CompareRow
              label="Rating"
              values={items.map(p => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <Stars rating={p.rating} />
                  <span style={{ fontSize: '0.72rem', color: 'var(--ink-faint)' }}>{p.rating}/5 · {p.reviewCount.toLocaleString()} reviews</span>
                </div>
              ))}
            />

            <CompareRow
              label="Category"
              values={items.map(p => (
                <span style={{ fontSize: '0.82rem', color: 'var(--ink-muted)', textTransform: 'capitalize' }}>{p.category}</span>
              ))}
            />

            <CompareRow
              label="Stock"
              values={items.map(p => stockLabel(p))}
            />

            <CompareRow
              label="Free Shipping"
              values={items.map(p => (
                p.price >= 49
                  ? <span style={{ color: '#16a34a', fontSize: '0.82rem', fontWeight: 500 }}>✓ Free shipping</span>
                  : <span style={{ color: 'var(--ink-faint)', fontSize: '0.82rem' }}>Not eligible</span>
              ))}
            />

            {/* Add to cart row */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `160px repeat(${items.length}, 1fr)`,
                background: 'var(--off-white)',
                borderTop: '2px solid var(--border)',
              }}
            >
              <div style={{ padding: '1rem', background: 'var(--off-white)', borderRight: '1px solid var(--border)', display: 'flex', alignItems: 'center', fontSize: '0.72rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>
                Action
              </div>
              {items.map(p => (
                <div key={p.id} style={{ padding: '1rem 1.25rem', borderRight: '1px solid var(--border)' }}>
                  <button
                    onClick={() => handleAddToCart(p)}
                    disabled={!!adding || added === p.id}
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      background: added === p.id ? '#16a34a' : adding === p.id ? 'var(--ink-faint)' : 'var(--red)',
                      color: 'var(--white)',
                      border: 'none',
                      borderRadius: 2,
                      fontSize: '0.82rem',
                      fontWeight: 500,
                      cursor: adding || added === p.id ? 'default' : 'pointer',
                      fontFamily: 'var(--sans)',
                      transition: 'background 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                    }}
                    onMouseEnter={e => { if (!adding && added !== p.id) e.currentTarget.style.background = 'var(--red-deep)'; }}
                    onMouseLeave={e => { if (!adding && added !== p.id) e.currentTarget.style.background = 'var(--red)'; }}
                  >
                    {added === p.id ? (
                      <>
                        <svg viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13"><path d="M2 7l3.5 3.5L12 4" /></svg>
                        Added!
                      </>
                    ) : adding === p.id ? 'Adding…' : (
                      <>
                        <svg viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" width="13" height="13"><path d="M7 2v10M2 7h10" /></svg>
                        Add to Cart
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { transform: scale(0.96); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </>
  );
}
