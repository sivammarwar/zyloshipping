'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

// ── Types ─────────────────────────────────────────────────────
interface CartItem {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  originalPrice: number;
  quantity: number;
  color: string;
  size: string;
}

// ── Mock cart state (replace with Zustand / context) ──────────
const INITIAL_ITEMS: CartItem[] = [
  { id: '1', slug: 'smart-wireless-crossbody-midnight', name: 'Smart Wireless Crossbody — Midnight Edition', category: 'Electronics', price: 89, originalPrice: 199, quantity: 1, color: 'Midnight Black', size: 'M / 10L' },
  { id: '3', slug: 'portable-power-bank-20k', name: 'Portable Power Bank 20K', category: 'Gadgets', price: 55, originalPrice: 99, quantity: 2, color: 'N/A', size: 'N/A' },
];

const PROMO_CODES: Record<string, number> = {
  ZYLO10: 10,
  FIRST20: 20,
  SAVE15: 15,
};

// ── Placeholder icon ──────────────────────────────────────────
function ItemIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" width="48" height="48">
      <rect x="8" y="16" width="48" height="36" rx="3" fill="#fdf0f2" stroke="#C41E3A" strokeWidth="1.5" />
      <path d="M22 16V13a10 10 0 0 1 20 0v3" stroke="#C41E3A" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="32" cy="34" r="5" fill="#C41E3A" opacity="0.25" />
      <circle cx="32" cy="34" r="2.5" fill="#C41E3A" />
    </svg>
  );
}

export default function CartPage() {
  const [items, setItems]         = useState<CartItem[]>(INITIAL_ITEMS);
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount]   = useState(0);
  const [promoError, setPromoError] = useState('');
  const [promoApplied, setPromoApplied] = useState('');

  function updateQty(id: string, delta: number) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
      )
    );
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  function applyPromo() {
    const code = promoCode.trim().toUpperCase();
    if (PROMO_CODES[code]) {
      setDiscount(PROMO_CODES[code]);
      setPromoApplied(code);
      setPromoError('');
    } else {
      setPromoError('Invalid promo code');
      setDiscount(0);
      setPromoApplied('');
    }
  }

  const subtotal  = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping  = subtotal >= 49 ? 0 : 6.99;
  const discountAmt = (subtotal * discount) / 100;
  const tax       = (subtotal - discountAmt) * 0.08;
  const total     = subtotal - discountAmt + shipping + tax;
  const savedAmt  = items.reduce((sum, i) => sum + (i.originalPrice - i.price) * i.quantity, 0);

  if (items.length === 0) {
    return (
      <>
        <Header />
        <main style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '7rem 4vw 4rem', textAlign: 'center' }}>
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" style={{ marginBottom: '1.5rem', opacity: 0.25 }}>
            <path d="M8 8h12l12 40a8 8 0 0 0 7.6 5.5H60a8 8 0 0 0 7.8-6.4L72 26H22" stroke="#1a1a18" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="34" cy="70" r="4" fill="#1a1a18" />
            <circle cx="60" cy="70" r="4" fill="#1a1a18" />
          </svg>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: '2rem', fontWeight: 900, color: 'var(--ink)', marginBottom: '0.75rem' }}>Your cart is empty</h2>
          <p style={{ fontSize: '0.95rem', color: 'var(--ink-muted)', marginBottom: '2rem', fontWeight: 300 }}>Discover something you'll love</p>
          <Link href="/products" className="btn-primary">Browse Products</Link>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />

      <main style={{ paddingTop: '5rem', background: 'var(--off-white)', minHeight: '100vh' }}>
        {/* Page header */}
        <div style={{ padding: '2rem 4vw 1.5rem', background: 'var(--white)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--red)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ display: 'inline-block', width: 16, height: 1, background: 'var(--red)' }} />
            Shopping Cart
          </div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--ink)' }}>
            {items.reduce((s, i) => s + i.quantity, 0)} item{items.reduce((s, i) => s + i.quantity, 0) !== 1 ? 's' : ''} in your cart
          </h1>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem', padding: '2.5rem 4vw 5rem', maxWidth: 1300, margin: '0 auto', alignItems: 'start' }}>

          {/* ── Cart items ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Savings banner */}
            {savedAmt > 0 && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 2, padding: '0.75rem 1rem', fontSize: '0.82rem', color: '#15803d', fontWeight: 400 }}>
                🎉 You&apos;re saving <strong>${savedAmt.toFixed(2)}</strong> on this order!
              </div>
            )}

            {/* Free shipping nudge */}
            {shipping > 0 && (
              <div style={{ background: 'var(--red-light)', border: '1px solid var(--red-mid)', borderRadius: 2, padding: '0.75rem 1rem', fontSize: '0.82rem', color: 'var(--red)', fontWeight: 400 }}>
                Add <strong>${(49 - subtotal).toFixed(2)}</strong> more to get free shipping!
              </div>
            )}

            {items.map((item) => (
              <div
                key={item.id}
                style={{
                  background: 'var(--white)',
                  border: '1px solid var(--border)',
                  borderRadius: 4,
                  padding: '1.25rem',
                  display: 'grid',
                  gridTemplateColumns: '80px 1fr auto',
                  gap: '1.25rem',
                  alignItems: 'center',
                  transition: 'border-color 0.2s',
                }}
              >
                {/* Product image */}
                <Link href={`/products/${item.slug}`}>
                  <div style={{ width: 80, height: 80, background: 'var(--red-light)', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <ItemIcon />
                  </div>
                </Link>

                {/* Product details */}
                <div>
                  <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-faint)', marginBottom: '0.2rem' }}>{item.category}</div>
                  <Link href={`/products/${item.slug}`} style={{ fontFamily: 'var(--serif)', fontSize: '0.95rem', fontWeight: 700, color: 'var(--ink)', textDecoration: 'none', display: 'block', marginBottom: '0.35rem', lineHeight: 1.3 }}>
                    {item.name}
                  </Link>
                  <div style={{ fontSize: '0.75rem', color: 'var(--ink-faint)', marginBottom: '0.75rem' }}>
                    {item.color !== 'N/A' && <span>{item.color}</span>}
                    {item.size !== 'N/A' && <span> · {item.size}</span>}
                  </div>

                  {/* Quantity controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                      <button onClick={() => updateQty(item.id, -1)} style={{ width: 30, height: 30, background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: 'var(--ink)', fontFamily: 'var(--sans)', transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--red-light)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>−</button>
                      <span style={{ width: 32, textAlign: 'center', fontSize: '0.85rem', fontWeight: 500 }}>{item.quantity}</span>
                      <button onClick={() => updateQty(item.id, 1)} style={{ width: 30, height: 30, background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: 'var(--ink)', fontFamily: 'var(--sans)', transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--red-light)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>+</button>
                    </div>
                    <button onClick={() => removeItem(item.id)} style={{ fontSize: '0.75rem', color: 'var(--ink-faint)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)', padding: 0, transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-faint)'}>
                      Remove
                    </button>
                    <Link href={`/products/${item.slug}`} style={{ fontSize: '0.75rem', color: 'var(--ink-faint)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-faint)'}>
                      Edit
                    </Link>
                  </div>
                </div>

                {/* Price */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--red)' }}>
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                  {item.quantity > 1 && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--ink-faint)' }}>${item.price.toFixed(2)} each</div>
                  )}
                  <div style={{ fontSize: '0.72rem', color: 'var(--ink-faint)', textDecoration: 'line-through' }}>
                    ${(item.originalPrice * item.quantity).toFixed(2)}
                  </div>
                </div>
              </div>
            ))}

            {/* Continue shopping */}
            <Link href="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--ink-muted)', textDecoration: 'none', marginTop: '0.5rem', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-muted)'}>
              ← Continue shopping
            </Link>
          </div>

          {/* ── Order summary ── */}
          <div style={{ position: 'sticky', top: '5.5rem' }}>
            <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '1.75rem', marginBottom: '1rem' }}>
              <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '1.5rem', letterSpacing: '-0.01em' }}>
                Order Summary
              </h2>

              {/* Line items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem' }}>
                {[
                  { label: `Subtotal (${items.reduce((s, i) => s + i.quantity, 0)} items)`, val: subtotal },
                  { label: 'Shipping', val: shipping, special: shipping === 0 ? 'Free' : null },
                  ...(discountAmt > 0 ? [{ label: `Promo (${promoApplied}) −${discount}%`, val: -discountAmt, isDiscount: true }] : []),
                  { label: 'Estimated tax (8%)', val: tax },
                ].map((row) => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.83rem' }}>
                    <span style={{ color: 'var(--ink-muted)', fontWeight: 300 }}>{row.label}</span>
                    <span style={{ color: (row as any).isDiscount ? '#16a34a' : 'var(--ink)', fontWeight: (row as any).isDiscount ? 500 : 400 }}>
                      {row.special ?? `${(row as any).isDiscount ? '−' : ''}$${Math.abs(row.val).toFixed(2)}`}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--serif)', fontWeight: 700, fontSize: '1rem', color: 'var(--ink)' }}>Total</span>
                <span style={{ fontFamily: 'var(--serif)', fontWeight: 900, fontSize: '1.4rem', color: 'var(--red)' }}>${total.toFixed(2)}</span>
              </div>

              {/* Promo code */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && applyPromo()}
                    placeholder="Promo code"
                    style={{ flex: 1, padding: '0.55rem 0.75rem', border: `1px solid ${promoError ? 'var(--red)' : 'var(--border)'}`, borderRadius: 2, fontSize: '0.82rem', fontFamily: 'var(--sans)', outline: 'none', color: 'var(--ink)' }}
                  />
                  <button onClick={applyPromo} style={{ padding: '0.55rem 0.9rem', background: 'var(--ink)', color: 'var(--white)', border: 'none', borderRadius: 2, fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--sans)', transition: 'background 0.2s' }}>
                    Apply
                  </button>
                </div>
                {promoError && <p style={{ fontSize: '0.72rem', color: 'var(--red)', marginTop: '0.35rem' }}>{promoError}</p>}
                {promoApplied && <p style={{ fontSize: '0.72rem', color: '#16a34a', marginTop: '0.35rem' }}>✓ Code applied — {discount}% off!</p>}
              </div>

              {/* Checkout button */}
              <Link
                href="/checkout"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  width: '100%',
                  padding: '0.9rem',
                  background: 'var(--red)',
                  color: 'var(--white)',
                  border: 'none',
                  borderRadius: 2,
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: 'var(--sans)',
                  letterSpacing: '0.03em',
                  textDecoration: 'none',
                  boxShadow: '0 4px 18px rgba(196,30,58,0.22)',
                  transition: 'background 0.2s, transform 0.15s',
                  textAlign: 'center',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--red-deep)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--red)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                Proceed to Checkout →
              </Link>
            </div>

            {/* Trust badges */}
            <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '1.25rem' }}>
              {[
                { icon: '🔒', text: 'SSL encrypted checkout' },
                { icon: '🚚', text: 'Free shipping on orders over $49' },
                { icon: '↩️', text: '7-day hassle-free returns' },
                { icon: '💳', text: 'All major payment methods accepted' },
              ].map((b) => (
                <div key={b.text} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.78rem', color: 'var(--ink-muted)', padding: '0.45rem 0', borderBottom: '1px solid var(--border)' }}>
                  <span>{b.icon}</span>
                  <span>{b.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <style>{`
        @media (max-width: 900px) {
          main > div[style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
          }
          main > div > div:last-child {
            position: relative !important;
            top: auto !important;
          }
        }
        @media (max-width: 640px) {
          main > div > div:first-child > div[style*="grid-template-columns: 80px"] {
            grid-template-columns: 70px 1fr !important;
            gap: 0.75rem !important;
          }
        }
      `}</style>
    </>
  );
}