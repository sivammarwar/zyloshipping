'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

// ── Mock product (replace with params-based API call) ─────────
const MOCK_PRODUCT = {
  id: '1',
  slug: 'smart-wireless-crossbody-midnight',
  name: 'Smart Wireless Crossbody — Midnight Edition',
  category: 'Electronics',
  price: 89,
  originalPrice: 199,
  rating: 4.8,
  reviewCount: 2341,
  badge: 'Bestseller',
  description: `The Smart Wireless Crossbody is engineered for the modern traveller. Built with water-resistant nylon shell, anti-theft zipper, and a hidden charging port that connects to your power bank inside.`,
  features: [
    'USB-C pass-through charging port',
    'RFID-blocking inner pocket',
    'Water-resistant 600D nylon shell',
    'Anti-theft zipper system',
    'Adjustable strap (70–130cm)',
    'Fits devices up to 10"',
  ],
  shippingInfo: 'Ships within 2.4h · Delivered in 5–8 business days',
  returnPolicy: '7-day hassle-free returns',
  variants: {
    colors: ['Midnight Black', 'Slate Grey', 'Ivory White'],
    sizes: ['S / 6L', 'M / 10L', 'L / 16L'],
  },
  images: [null, null, null, null], // null = show placeholder
};

const MOCK_REVIEWS = [
  { id: 1, initials: 'RK', name: 'Ryan K.', loc: 'New York, US', rating: 5, date: '2 weeks ago', text: 'Absolutely love this bag. The charging port is a game-changer for long commutes. Build quality is excellent for the price.' },
  { id: 2, initials: 'PS', name: 'Priya S.', loc: 'London, UK', rating: 5, date: '1 month ago', text: 'Bought the Ivory White edition. Looks stunning and incredibly practical. Will definitely order again.' },
  { id: 3, initials: 'TM', name: 'Takumi M.', loc: 'Tokyo, JP', rating: 4, date: '3 weeks ago', text: 'Great bag overall. The RFID pocket is a nice touch. Would love a few more internal organiser pockets though.' },
];

const RELATED_PRODUCTS = [
  { id: '2', slug: 'minimalist-desk-lamp', name: 'Minimalist Desk Lamp', price: 39, originalPrice: 75, category: 'Home Decor', rating: 4 },
  { id: '3', slug: 'portable-power-bank-20k', name: 'Portable Power Bank 20K', price: 55, originalPrice: 99, category: 'Gadgets', rating: 5 },
  { id: '7', slug: 'noise-cancelling-buds', name: 'Noise Cancelling Earbuds Pro', price: 79, originalPrice: 149, category: 'Electronics', rating: 5 },
];

function Stars({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
  const fontSize = size === 'lg' ? '1.1rem' : '0.72rem';
  const filled = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <span style={{ color: 'var(--red)', fontSize, letterSpacing: 2 }}>
      {Array.from({ length: 5 }, (_, i) => i < filled ? '★' : (i === filled && half) ? '½' : '☆').join('')}
    </span>
  );
}

export default function ProductDetailPage({ params }: { params: { slug: string } }) {
  const [selectedColor, setSelectedColor] = useState(MOCK_PRODUCT.variants.colors[0]);
  const [selectedSize, setSelectedSize]   = useState(MOCK_PRODUCT.variants.sizes[1]);
  const [quantity, setQuantity]           = useState(1);
  const [activeImage, setActiveImage]     = useState(0);
  const [added, setAdded]                 = useState(false);
  const [tab, setTab]                     = useState<'description' | 'features' | 'shipping'>('description');

  useEffect(() => {
    setTimeout(() => {
      document.querySelectorAll('.reveal').forEach((el, i) => {
        setTimeout(() => el.classList.add('visible'), i * 80);
      });
    }, 100);
  }, []);

  const discount = Math.round(((MOCK_PRODUCT.originalPrice - MOCK_PRODUCT.price) / MOCK_PRODUCT.originalPrice) * 100);

  function handleAddToCart() {
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  const PlaceholderIcon = () => (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" width="80" height="80">
      <rect x="10" y="20" width="60" height="45" rx="3" fill="#fdf0f2" stroke="#C41E3A" strokeWidth="1.5" />
      <path d="M27 20V16a13 13 0 0 1 26 0v4" stroke="#C41E3A" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="40" cy="42" r="7" fill="#C41E3A" opacity="0.2" />
      <circle cx="40" cy="42" r="3.5" fill="#C41E3A" />
    </svg>
  );

  return (
    <>
      <Header />

      <main style={{ paddingTop: '5rem' }}>
        {/* Breadcrumb */}
        <div style={{ padding: '1.5rem 4vw', borderBottom: '1px solid var(--border)', background: 'var(--white)', fontSize: '0.78rem', color: 'var(--ink-faint)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Link href="/" style={{ color: 'var(--ink-faint)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-faint)'}>Home</Link>
          <span>›</span>
          <Link href="/products" style={{ color: 'var(--ink-faint)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-faint)'}>Products</Link>
          <span>›</span>
          <Link href="/products?category=Electronics" style={{ color: 'var(--ink-faint)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-faint)'}>{MOCK_PRODUCT.category}</Link>
          <span>›</span>
          <span style={{ color: 'var(--ink)' }}>{MOCK_PRODUCT.name}</span>
        </div>

        {/* ── Product layout ── */}
        <section style={{ padding: '3rem 4vw 5rem', background: 'var(--off-white)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', maxWidth: 1200, margin: '0 auto', alignItems: 'start' }}>

            {/* Left: Image gallery */}
            <div className="reveal">
              {/* Main image */}
              <div style={{ background: 'var(--red-light)', borderRadius: 4, border: '1px solid var(--border)', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', position: 'relative', overflow: 'hidden' }}>
                {MOCK_PRODUCT.badge && (
                  <div style={{ position: 'absolute', top: '1rem', left: '1rem', background: 'var(--red)', color: 'var(--white)', fontSize: '0.65rem', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '0.3rem 0.7rem', borderRadius: 1 }}>
                    {MOCK_PRODUCT.badge}
                  </div>
                )}
                <div style={{ opacity: 0.5 }}>
                  <PlaceholderIcon />
                </div>
                <div style={{ position: 'absolute', bottom: '1rem', right: '1rem', background: 'var(--red)', color: 'var(--white)', fontSize: '0.7rem', fontWeight: 600, padding: '0.25rem 0.6rem', borderRadius: 1 }}>
                  -{discount}%
                </div>
              </div>
              {/* Thumbnails */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                {MOCK_PRODUCT.images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    style={{
                      aspectRatio: '1',
                      background: 'var(--red-light)',
                      border: `2px solid ${activeImage === i ? 'var(--red)' : 'var(--border)'}`,
                      borderRadius: 3,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'border-color 0.2s',
                    }}
                  >
                    <div style={{ opacity: 0.3 }}>
                      <svg viewBox="0 0 40 40" fill="none" width="32" height="32">
                        <rect x="5" y="10" width="30" height="22" rx="2" fill="none" stroke="#C41E3A" strokeWidth="1.5" />
                        <path d="M13 10V8a7 7 0 0 1 14 0v2" stroke="#C41E3A" strokeWidth="1.5" strokeLinecap="round" />
                        <circle cx="20" cy="21" r="4" fill="#C41E3A" opacity="0.3" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Product info */}
            <div>
              <div className="reveal" style={{ fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--red)', marginBottom: '0.75rem' }}>
                {MOCK_PRODUCT.category}
              </div>
              <h1 className="reveal reveal-delay-1" style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--ink)', lineHeight: 1.1, marginBottom: '1rem' }}>
                {MOCK_PRODUCT.name}
              </h1>

              {/* Rating row */}
              <div className="reveal reveal-delay-1" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <Stars rating={MOCK_PRODUCT.rating} />
                <span style={{ fontSize: '0.82rem', color: 'var(--ink-muted)' }}>{MOCK_PRODUCT.rating} ({MOCK_PRODUCT.reviewCount.toLocaleString()} reviews)</span>
                <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 500 }}>✓ In stock</span>
              </div>

              {/* Price */}
              <div className="reveal reveal-delay-2" style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '1.75rem' }}>
                <span style={{ fontFamily: 'var(--serif)', fontSize: '2.2rem', fontWeight: 900, color: 'var(--red)', lineHeight: 1 }}>
                  ${MOCK_PRODUCT.price.toFixed(2)}
                </span>
                <span style={{ fontSize: '1rem', color: 'var(--ink-faint)', textDecoration: 'line-through', fontWeight: 300 }}>
                  ${MOCK_PRODUCT.originalPrice.toFixed(2)}
                </span>
                <span style={{ background: 'var(--red)', color: 'var(--white)', fontSize: '0.72rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: 1 }}>
                  -{discount}% OFF
                </span>
              </div>

              {/* Color select */}
              <div className="reveal reveal-delay-2" style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '0.6rem' }}>
                  Color — <span style={{ color: 'var(--ink)', textTransform: 'none', letterSpacing: 0 }}>{selectedColor}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {MOCK_PRODUCT.variants.colors.map((c) => (
                    <button
                      key={c}
                      onClick={() => setSelectedColor(c)}
                      style={{
                        padding: '0.45rem 0.9rem',
                        border: `1.5px solid ${selectedColor === c ? 'var(--red)' : 'var(--border)'}`,
                        borderRadius: 2,
                        background: selectedColor === c ? 'var(--red-light)' : 'var(--white)',
                        color: selectedColor === c ? 'var(--red)' : 'var(--ink-muted)',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        fontFamily: 'var(--sans)',
                        transition: 'all 0.15s',
                        fontWeight: selectedColor === c ? 500 : 300,
                      }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size select */}
              <div className="reveal reveal-delay-2" style={{ marginBottom: '1.75rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '0.6rem' }}>
                  Size — <span style={{ color: 'var(--ink)', textTransform: 'none', letterSpacing: 0 }}>{selectedSize}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {MOCK_PRODUCT.variants.sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      style={{
                        padding: '0.45rem 0.9rem',
                        border: `1.5px solid ${selectedSize === s ? 'var(--red)' : 'var(--border)'}`,
                        borderRadius: 2,
                        background: selectedSize === s ? 'var(--red-light)' : 'var(--white)',
                        color: selectedSize === s ? 'var(--red)' : 'var(--ink-muted)',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        fontFamily: 'var(--sans)',
                        transition: 'all 0.15s',
                        fontWeight: selectedSize === s ? 500 : 300,
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity + Add to cart */}
              <div className="reveal reveal-delay-3" style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.25rem' }}>
                {/* Quantity */}
                <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{ width: 36, height: 44, background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: 'var(--ink)', fontFamily: 'var(--sans)', transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--red-light)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>−</button>
                  <span style={{ width: 36, textAlign: 'center', fontSize: '0.88rem', fontWeight: 500, color: 'var(--ink)' }}>{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} style={{ width: 36, height: 44, background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: 'var(--ink)', fontFamily: 'var(--sans)', transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--red-light)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>+</button>
                </div>

                {/* Add to cart */}
                <button
                  onClick={handleAddToCart}
                  style={{
                    flex: 1,
                    padding: '0 1.5rem',
                    height: 44,
                    background: added ? 'var(--red-deep)' : 'var(--red)',
                    color: 'var(--white)',
                    border: 'none',
                    borderRadius: 2,
                    fontSize: '0.88rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: 'var(--sans)',
                    letterSpacing: '0.03em',
                    transition: 'background 0.2s, transform 0.15s',
                    transform: added ? 'translateY(-1px)' : 'translateY(0)',
                    boxShadow: '0 4px 18px rgba(196,30,58,0.22)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                  }}
                >
                  {added ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 7l3.5 3.5L12 4" /></svg>
                      Added to cart
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 1h2l2.4 7.2A1.5 1.5 0 0 0 6.9 9H11a1.5 1.5 0 0 0 1.5-1.2L13.5 4H4" /><circle cx="6.5" cy="12" r="0.8" /><circle cx="11.5" cy="12" r="0.8" /></svg>
                      Add to cart — ${(MOCK_PRODUCT.price * quantity).toFixed(2)}
                    </>
                  )}
                </button>

                {/* Wishlist */}
                <button style={{ width: 44, height: 44, border: '1.5px solid var(--border)', borderRadius: 2, background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'border-color 0.2s, color 0.2s', color: 'var(--ink-faint)' }} onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--red)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--red)'; }} onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--ink-faint)'; }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 14S1 9.5 1 5a4 4 0 0 1 7-2.65A4 4 0 0 1 15 5c0 4.5-7 9-7 9z" /></svg>
                </button>
              </div>

              {/* Trust badges */}
              <div className="reveal reveal-delay-3" style={{ display: 'flex', gap: '1rem', padding: '1rem', background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 2, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                {[
                  { icon: '🚚', text: MOCK_PRODUCT.shippingInfo },
                  { icon: '↩️', text: MOCK_PRODUCT.returnPolicy },
                  { icon: '🔒', text: 'Secure checkout' },
                ].map((b) => (
                  <div key={b.text} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--ink-muted)', flex: '1 1 160px' }}>
                    <span>{b.icon}</span>
                    <span>{b.text}</span>
                  </div>
                ))}
              </div>

              {/* Tabs */}
              <div className="reveal">
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '1.25rem' }}>
                  {(['description', 'features', 'shipping'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      style={{
                        padding: '0.6rem 1rem',
                        background: 'none',
                        border: 'none',
                        borderBottom: `2px solid ${tab === t ? 'var(--red)' : 'transparent'}`,
                        fontSize: '0.8rem',
                        fontWeight: tab === t ? 500 : 300,
                        color: tab === t ? 'var(--red)' : 'var(--ink-muted)',
                        cursor: 'pointer',
                        fontFamily: 'var(--sans)',
                        textTransform: 'capitalize',
                        transition: 'all 0.2s',
                        marginBottom: -1,
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {tab === 'description' && (
                  <p style={{ fontSize: '0.88rem', color: 'var(--ink-muted)', lineHeight: 1.75, fontWeight: 300 }}>
                    {MOCK_PRODUCT.description}
                  </p>
                )}
                {tab === 'features' && (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {MOCK_PRODUCT.features.map((f) => (
                      <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--ink-muted)', fontWeight: 300 }}>
                        <span style={{ color: 'var(--red)', fontWeight: 600, marginTop: 1 }}>—</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                )}
                {tab === 'shipping' && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', lineHeight: 1.75, fontWeight: 300 }}>
                    <p><strong style={{ color: 'var(--ink)' }}>Processing time:</strong> Orders are dispatched within 2.4 hours on average.</p>
                    <p style={{ marginTop: '0.5rem' }}><strong style={{ color: 'var(--ink)' }}>Delivery:</strong> 5–8 business days to most countries via tracked courier.</p>
                    <p style={{ marginTop: '0.5rem' }}><strong style={{ color: 'var(--ink)' }}>Returns:</strong> 7-day hassle-free returns. Contact support to initiate.</p>
                    <p style={{ marginTop: '0.5rem' }}><strong style={{ color: 'var(--ink)' }}>Tracking:</strong> You'll receive SMS and email updates at every milestone.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── Reviews ── */}
        <section style={{ padding: '4rem 4vw', background: 'var(--white)', borderTop: '1px solid var(--border)' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--red)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ display: 'inline-block', width: 16, height: 1, background: 'var(--red)' }} />
                  Customer Reviews
                </div>
                <h2 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--ink)' }}>
                  {MOCK_PRODUCT.rating} / 5 · {MOCK_PRODUCT.reviewCount.toLocaleString()} reviews
                </h2>
              </div>
              <button style={{ background: 'var(--red)', color: 'var(--white)', border: 'none', borderRadius: 2, padding: '0.65rem 1.4rem', fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--sans)' }}>
                Write a review
              </button>
            </div>

            {/* Rating bars */}
            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '3rem', marginBottom: '3rem', alignItems: 'start' }}>
              <div>
                <Stars rating={MOCK_PRODUCT.rating} size="lg" />
                <div style={{ fontSize: '2.5rem', fontFamily: 'var(--serif)', fontWeight: 900, color: 'var(--ink)', lineHeight: 1, marginTop: '0.25rem' }}>{MOCK_PRODUCT.rating}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--ink-faint)', marginTop: '0.25rem' }}>Based on {MOCK_PRODUCT.reviewCount.toLocaleString()} reviews</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {[5, 4, 3, 2, 1].map((star, i) => {
                  const pcts = [68, 22, 6, 3, 1];
                  return (
                    <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', width: 8 }}>{star}</span>
                      <span style={{ color: 'var(--red)', fontSize: '0.7rem' }}>★</span>
                      <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${pcts[i]}%`, height: '100%', background: 'var(--red)', borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--ink-faint)', width: 28 }}>{pcts[i]}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Review cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {MOCK_REVIEWS.map((r) => (
                <div key={r.id} style={{ padding: '1.5rem', border: '1px solid var(--border)', borderRadius: 4, background: 'var(--off-white)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--serif)', fontSize: '0.8rem', fontWeight: 700, color: 'var(--white)' }}>
                        {r.initials}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--ink)' }}>{r.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--ink-faint)' }}>{r.loc}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Stars rating={r.rating} />
                      <span style={{ fontSize: '0.72rem', color: 'var(--ink-faint)' }}>{r.date}</span>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.88rem', color: 'var(--ink-muted)', lineHeight: 1.7, fontWeight: 300 }}>{r.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <style>{`
        @media (max-width: 900px) {
          section > div > div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
          section > div > div[style*="grid-template-columns: 200px"] {
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
          }
        }
      `}</style>
    </>
  );
}