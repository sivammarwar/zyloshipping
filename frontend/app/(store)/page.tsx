'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/store/ProductCard';
import { api } from '@/lib/api';

interface Product {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviewCount: number;
  badge?: string;
  imageUrl?: string;
}

const TICKER_ITEMS = [
  'Free shipping above $49',
  'Visa · Mastercard · PayPal · Apple Pay',
  '10,000+ verified products',
  'AI-powered pricing & curation',
  'Same-day dispatch for major cities',
  '7-day hassle-free returns',
];

const HOW_STEPS = [
  {
    num: '01',
    title: 'Browse & Add to Cart',
    desc: 'Explore 10,000+ AI-curated products from verified global suppliers. Filter by category, price, and delivery time.',
  },
  {
    num: '02',
    title: 'Pay Your Way',
    desc: 'Checkout in seconds — cards, PayPal, Apple Pay, Google Pay, and local payment methods worldwide.',
  },
  {
    num: '03',
    title: 'We Order from Supplier',
    desc: 'Your order is automatically submitted to the supplier within minutes. Our AI agents watch every order 24/7.',
  },
  {
    num: '04',
    title: 'Track Every Step',
    desc: 'Real-time tracking powered by AfterShip. Email and SMS updates at every milestone — dispatched to delivered.',
  },
];

const TESTIMONIALS: any[] = [];

// ── Scroll reveal hook ────────────────────────────────────────
function useScrollReveal() {
  useEffect(() => {
    const reveals = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    reveals.forEach((el) => observer.observe(el));

    // Hero reveals on load
    setTimeout(() => {
      document.querySelectorAll('.hero .reveal').forEach((el, i) => {
        setTimeout(() => el.classList.add('visible'), i * 120);
      });
    }, 200);

    return () => observer.disconnect();
  }, []);
}

// ── Star renderer ─────────────────────────────────────────────
function Stars({ rating }: { rating: number }) {
  return (
    <span style={{ color: 'var(--red)', fontSize: '0.7rem', letterSpacing: '1px' }}>
      {Array.from({ length: 5 }, (_, i) => (i < rating ? '★' : '☆')).join('')}
    </span>
  );
}

// ── Page Component ────────────────────────────────────────────
export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await api.products.list({ limit: 5, sortBy: 'totalSales', sortDir: 'desc' });
        const mapped = response.products?.slice(0, 5).map((p: any) => p.storefront || {
          id: p.id,
          slug: p.slug,
          name: p.title,
          category: p.category,
          price: p.price,
          originalPrice: Math.round(p.price * 2.1),
          rating: Math.min(5, Math.round(p.rating || 0)),
          reviewCount: p.totalSales || 0,
          badge: p.status === 'LOW' ? 'Low stock' : p.totalSales > 2000 ? 'Bestseller' : undefined,
          imageUrl: Array.isArray(p.imagesJson) ? p.imagesJson[0] : undefined,
        }) || [];
        setProducts(mapped);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  useScrollReveal();

  return (
    <>
      <Header />

      {/* ── HERO ── */}
      <section
        className="hero"
        style={{
          minHeight: '100vh',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          alignItems: 'center',
          padding: '8rem 4vw 4rem',
          gap: '2rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Angled background */}
        <div
          style={{
            position: 'absolute',
            right: '-10vw',
            top: '-10vh',
            width: '60vw',
            height: '110vh',
            background: 'var(--red-light)',
            transform: 'rotate(-4deg)',
            zIndex: 0,
            borderRadius: '2px',
          }}
        />

        {/* Hero text */}
        <div className="hero" style={{ position: 'relative', zIndex: 1, paddingRight: '2rem' }}>
          <div
            className="reveal"
            style={{
              display: 'inline-block',
              fontSize: '0.72rem',
              fontWeight: 500,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--red)',
              marginBottom: '1.2rem',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: 24,
                height: 1.5,
                background: 'var(--red)',
                marginRight: '0.6rem',
                verticalAlign: 'middle',
              }}
            />
            World&apos;s Fastest Dropshipping
          </div>

          <h1
            className="reveal reveal-delay-1"
            style={{
              fontFamily: 'var(--serif)',
              fontSize: 'clamp(2.8rem, 5.5vw, 5rem)',
              fontWeight: 900,
              lineHeight: 1.06,
              letterSpacing: '-0.025em',
              color: 'var(--ink)',
              marginBottom: '1.5rem',
            }}
          >
            Ship anything,{' '}
            <span
              style={{
                color: 'var(--red)',
                position: 'relative',
                display: 'inline-block',
              }}
            >
              anywhere
              <span
                style={{
                  position: 'absolute',
                  bottom: -4,
                  left: -2,
                  right: -2,
                  height: 5,
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 8' preserveAspectRatio='none'%3E%3Cpath d='M2,5 C15,2 35,7 55,4 C75,1 95,7 118,4' stroke='%23C41E3A' stroke-width='2.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\")",
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '100% 100%',
                }}
              />
            </span>
            <br />
            in the world.
          </h1>

          <p
            className="reveal reveal-delay-2"
            style={{
              fontSize: '1.05rem',
              fontWeight: 300,
              color: 'var(--ink-muted)',
              lineHeight: 1.75,
              maxWidth: 440,
              marginBottom: '2.5rem',
            }}
          >
            AI-curated products from verified global suppliers. Every payment method. Real-time tracking. Zero inventory headaches.
          </p>

          <div
            className="reveal reveal-delay-3"
            style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}
          >
            <Link href="/products" className="btn-primary">
              Browse Products
            </Link>
            <Link href="#how-it-works" className="btn-ghost">
              How it works →
            </Link>
          </div>
        </div>

        {/* Floating stats */}
        <div style={{ position: 'relative', zIndex: 1, height: 480 }}>
          {/* Circle backdrops */}
          <div
            style={{
              position: 'absolute',
              width: 340,
              height: 340,
              borderRadius: '50%',
              border: '40px solid var(--red-mid)',
              opacity: 0.35,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: 200,
              height: 200,
              borderRadius: '50%',
              background: 'var(--red)',
              opacity: 0.08,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />

          {/* Product mockup */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 200,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: 160,
                background: 'var(--white)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                padding: '1rem',
                textAlign: 'center',
                boxShadow: '0 12px 40px rgba(0,0,0,0.1)',
              }}
            >
              <div style={{ width: 64, height: 64, margin: '0 auto 0.6rem' }}>
                <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" width="64" height="64">
                  <rect x="8" y="16" width="48" height="36" rx="3" fill="#fdf0f2" stroke="#C41E3A" strokeWidth="1.5" />
                  <path d="M22 16V13a10 10 0 0 1 20 0v3" stroke="#C41E3A" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="32" cy="34" r="5" fill="#C41E3A" opacity="0.25" />
                  <circle cx="32" cy="34" r="2.5" fill="#C41E3A" />
                </svg>
              </div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--red)' }}>$89</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--ink-muted)', marginTop: '0.15rem' }}>Premium Wireless Bag</div>
            </div>
          </div>

        </div>
      </section>

      {/* ── TICKER ── */}
      <div
        style={{
          background: 'var(--red)',
          color: 'var(--white)',
          padding: '0.6rem 0',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
        }}
        aria-hidden="true"
      >
        <div className="animate-ticker" style={{ display: 'inline-flex' }}>
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0 2.5rem' }}>
                {item}
              </span>
              <span
                style={{
                  display: 'inline-block',
                  width: 4,
                  height: 4,
                  background: 'rgba(255,255,255,0.5)',
                  borderRadius: '50%',
                  marginRight: '2.5rem',
                }}
              />
            </span>
          ))}
        </div>
      </div>

      {/* ── PRODUCTS ── */}
      <section style={{ padding: '6rem 4vw', background: 'var(--white)' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: '3rem',
            gap: '2rem',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div className="section-label reveal">Trending Now</div>
            <h2 className="section-title reveal reveal-delay-1">
              Curated for<br />global buyers
            </h2>
          </div>
          <Link href="/products" className="btn-ghost reveal">
            View all products →
          </Link>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--ink-faint)' }}>
            <div style={{ fontSize: '0.9rem' }}>Loading featured products...</div>
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', color: 'var(--ink-faint)', marginBottom: '0.5rem' }}>No products available yet</div>
            <p style={{ fontSize: '0.88rem', color: 'var(--ink-faint)', marginBottom: '1.5rem' }}>Check back soon for amazing deals!</p>
            <Link href="/products" className="btn-ghost">Browse all products →</Link>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '1.5rem',
            }}
          >
            {products.map((product, i) => (
              <ProductCard key={product.id} product={product} delayClass={`reveal-delay-${(i % 3) + 1}`} />
            ))}
          </div>
        )}
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ padding: '6rem 4vw', background: 'var(--off-white)' }}>
        <div className="section-label reveal">The Process</div>
        <h2 className="section-title reveal reveal-delay-1">
          From click<br />to doorstep
        </h2>
        <p className="section-sub reveal reveal-delay-2">We handle the logistics. You handle growing your store.</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'start', marginTop: '3rem' }}>
          {/* Steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {HOW_STEPS.map((step, i) => (
              <div
                key={step.num}
                className={`reveal reveal-delay-${i}`}
                style={{
                  display: 'flex',
                  gap: '1.5rem',
                  alignItems: 'flex-start',
                  position: 'relative',
                  paddingBottom: '2rem',
                  borderBottom: i < HOW_STEPS.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    background: 'var(--white)',
                    border: '1.5px solid var(--red)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--serif)',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: 'var(--red)',
                    flexShrink: 0,
                  }}
                >
                  {step.num}
                </div>
                <div>
                  <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.35rem' }}>
                    {step.title}
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--ink-muted)', fontWeight: 300, lineHeight: 1.65 }}>
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Order timeline visual */}
          <div
            className="reveal reveal-delay-1"
            style={{
              background: 'var(--white)',
              border: '1px solid var(--border)',
              borderRadius: 4,
              padding: '2.5rem',
              position: 'sticky',
              top: '7rem',
            }}
          >
            <div style={{ fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '1rem' }}>
              Live order — #ZY-28431
            </div>
            {[
              { dot: 'done', label: 'Order placed', time: 'Mon, 09:14' },
              { dot: 'done', label: 'Payment confirmed', time: 'Mon, 09:15' },
              { dot: 'done', label: 'Submitted to supplier', time: 'Mon, 09:17' },
              { dot: 'active', label: 'In transit — Chicago Hub', time: null, live: true },
              { dot: 'pending', label: 'Out for delivery', time: 'Est. Wed', muted: true },
              { dot: 'pending', label: 'Delivered', time: '', muted: true },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '0.75rem 0',
                  borderBottom: i < 5 ? '1px solid var(--border)' : 'none',
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    flexShrink: 0,
                    background:
                      item.dot === 'active' ? 'var(--red)' :
                      item.dot === 'done'   ? 'var(--ink-faint)' : 'var(--border)',
                    border: item.dot === 'pending' ? '1.5px solid var(--ink-faint)' : 'none',
                  }}
                />
                <div style={{ flex: 1, fontSize: '0.82rem', color: item.muted ? 'var(--ink-faint)' : 'var(--ink)', fontWeight: item.dot === 'active' ? 500 : 400 }}>
                  {item.label}
                </div>
                {item.live && (
                  <span style={{ fontSize: '0.62rem', padding: '0.18rem 0.5rem', borderRadius: 1, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', background: 'var(--red-light)', color: 'var(--red)' }}>
                    Live
                  </span>
                )}
                {item.time && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--ink-faint)', fontWeight: 300 }}>{item.time}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PAYMENT SECTION ── */}
      <section style={{ background: 'var(--ink)', color: 'var(--white)', padding: '6rem 4vw', position: 'relative', overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            top: -100,
            right: -100,
            width: 500,
            height: 500,
            background: 'var(--red)',
            borderRadius: '50%',
            opacity: 0.06,
          }}
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '4rem', alignItems: 'center' }}>
          <div>
            <div className="section-label reveal" style={{ '--tw-text-opacity': 1 } as React.CSSProperties}>
              Payments
            </div>
            <h2
              className="reveal reveal-delay-1"
              style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--white)', lineHeight: 1.12, marginBottom: '1rem' }}
            >
              Every way<br />the world pays
            </h2>
            <p className="reveal reveal-delay-2" style={{ fontSize: '0.98rem', color: 'rgba(255,255,255,0.5)', fontWeight: 300, maxWidth: 420, lineHeight: 1.7 }}>
              Built on Stripe — the most trusted global payment infrastructure. Cards, digital wallets, bank transfers, and local methods across 135+ currencies.
            </p>
            <div className="reveal reveal-delay-3" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '2rem' }}>
              {[
                { dot: '#4285F4', label: 'Visa / Mastercard' },
                { dot: '#4285F4', label: 'Google Pay' },
                { dot: '#000', label: 'Apple Pay' },
                { dot: '#003087', label: 'PayPal' },
                { dot: '#FF6B00', label: 'Klarna' },
                { dot: '#00A650', label: 'Afterpay' },
                { dot: '#6B21A8', label: 'Bank Transfer' },
                { dot: '#C41E3A', label: 'Amex' },
                { dot: '#4285F4', label: 'Link' },
                { dot: '#aaa', label: '135+ currencies' },
              ].map((chip) => (
                <div
                  key={chip.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 2,
                    padding: '0.55rem 1rem',
                    fontSize: '0.8rem',
                    color: 'rgba(255,255,255,0.75)',
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: chip.dot, flexShrink: 0 }} />
                  {chip.label}
                </div>
              ))}
            </div>
          </div>

          {/* Payment card mockup */}
          <div className="reveal reveal-delay-2" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)' }}>Order Total</div>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--white)' }}>$89.00</div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.15rem' }}>incl. tax & shipping</div>
                </div>
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <rect x="2" y="6" width="24" height="16" rx="3" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                  <path d="M2 11h24" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                  <rect x="6" y="16" width="6" height="2" rx="1" fill="rgba(255,255,255,0.2)" />
                </svg>
              </div>
              <div style={{ background: 'rgba(66,133,244,0.12)', border: '1px solid rgba(66,133,244,0.25)', borderRadius: 2, padding: '0.8rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.65)', fontWeight: 300 }}>Paying via: <strong>Google Pay</strong></span>
                <span style={{ fontSize: '0.65rem', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', background: 'rgba(66,133,244,0.2)', color: '#7bb3f0', padding: '0.2rem 0.5rem', borderRadius: 1 }}>Verified</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0 0.25rem' }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
              <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.08em' }}>SECURED BY</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', justifyContent: 'center', padding: '0.25rem 0' }}>
              {['Stripe', '256-bit SSL', 'PCI DSS Level 1'].map((label, i) => (
                <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', fontWeight: 300 }}>{label}</span>
                  {i < 2 && <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'inline-block' }} />}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* ── CTA BANNER ── */}
      <section style={{ padding: '5rem 4vw', background: 'var(--red)', color: 'var(--white)', textAlign: 'center' }}>
        <h2
          className="reveal"
          style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--white)', marginBottom: '1rem' }}
        >
          Ready to start selling?
        </h2>
        <p className="reveal reveal-delay-1" style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.75)', marginBottom: '2rem', fontWeight: 300 }}>
          Start shipping worldwide with ZyloShipping.
        </p>
        <div className="reveal reveal-delay-2" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            href="/register"
            style={{
              background: 'var(--white)',
              color: 'var(--red)',
              padding: '0.85rem 2.5rem',
              borderRadius: 2,
              fontWeight: 500,
              fontSize: '0.88rem',
              letterSpacing: '0.03em',
              textDecoration: 'none',
              transition: 'transform 0.15s',
              display: 'inline-block',
            }}
          >
            Start for free →
          </Link>
          <Link href="/products" className="btn-ghost" style={{ color: 'rgba(255,255,255,0.8)', borderColor: 'rgba(255,255,255,0.4)' }}>
            Browse products
          </Link>
        </div>
      </section>

      <Footer />
    </>
  );
}