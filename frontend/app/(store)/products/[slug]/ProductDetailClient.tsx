'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { ReviewList } from '@/components/reviews/ReviewList';
import { StarRating } from '@/components/reviews/StarRating';
import { getProductBySlug } from '@/lib/api/products';
import { addToCart } from '@/lib/api/cart';
import { useCompare } from '@/context/CompareContext';

interface ProductDetail {
  id: string;
  slug: string;
  title: string;
  name: string;
  description: string;
  category: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviewCount: number;
  totalSales: number;
  imagesJson: unknown;
  status: string;
}

export default function ProductDetailClient() {
  const params                        = useParams<{ slug: string }>();
  const [product, setProduct]         = useState<ProductDetail | null>(null);
  const [loading, setLoading]         = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity]       = useState(1);
  const [adding, setAdding]           = useState(false);
  const [added, setAdded]             = useState(false);
  const [tab, setTab]                 = useState<'description' | 'shipping'>('description');
  const [atMax, setAtMax]             = useState(false);
  const { toggle, isSelected, isAtMax } = useCompare();

  useEffect(() => {
    if (!params?.slug) return;
    (async () => {
      try {
        const res = await getProductBySlug(params.slug);
        setProduct(res.product as ProductDetail);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [params?.slug]);

  async function handleAddToCart() {
    if (!product || adding) return;
    setAdding(true);
    try {
      await addToCart(product.id, quantity);
      setAdded(true);
      setTimeout(() => setAdded(false), 2200);
    } catch (e) {
      console.error(e);
    } finally {
      setAdding(false);
    }
  }

  const images: string[] = Array.isArray(product?.imagesJson)
    ? (product!.imagesJson as string[])
    : [];

  const discount = product
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const PlaceholderImg = () => (
    <svg viewBox="0 0 80 80" fill="none" width="80" height="80">
      <rect x="10" y="20" width="60" height="45" rx="3" fill="var(--red-light)" stroke="var(--red-mid)" strokeWidth="1.5" />
      <path d="M27 20V16a13 13 0 0 1 26 0v4" stroke="var(--red-mid)" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="40" cy="42" r="7" fill="var(--red)" opacity="0.2" />
      <circle cx="40" cy="42" r="3.5" fill="var(--red)" />
    </svg>
  );

  if (loading) {
    return (
      <>
        <Header />
        <main style={{ paddingTop: '5rem', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: 'var(--ink-faint)' }}>
            <div style={{ width: 32, height: 32, border: '2px solid var(--red)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 1rem' }} />
            Loading product…
          </div>
        </main>
        <Footer />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Header />
        <main style={{ paddingTop: '5rem', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
          <h1 style={{ fontFamily: 'var(--serif)', color: 'var(--ink)', fontSize: '2rem' }}>Product not found</h1>
          <Link href="/products" style={{ color: 'var(--red)', fontSize: '0.9rem' }}>← Back to catalogue</Link>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main style={{ paddingTop: '5rem' }}>
        <nav style={{ padding: '1.25rem 4vw', borderBottom: '1px solid var(--border)', background: 'var(--white)', fontSize: '0.78rem', color: 'var(--ink-faint)', display: 'flex', gap: '0.5rem', alignItems: 'center', overflowX: 'auto', whiteSpace: 'nowrap' }}>
          {[
            { label: 'Home',     href: '/' },
            { label: 'Products', href: '/products' },
            { label: product.category, href: `/category/${product.category.toLowerCase().replace(/\s+/g, '-')}` },
          ].map((b, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Link href={b.href} style={{ color: 'var(--ink-faint)', textDecoration: 'none' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-faint)'}
              >{b.label}</Link>
              <span>›</span>
            </span>
          ))}
          <span style={{ color: 'var(--ink)' }}>{product.title}</span>
        </nav>

        <section style={{ padding: '3rem 4vw 5rem', background: 'var(--off-white)' }}>
          <div className="product-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', maxWidth: 1200, margin: '0 auto', alignItems: 'start' }}>

            <div>
              <div style={{ background: 'var(--red-light)', borderRadius: 4, border: '1px solid var(--border)', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', position: 'relative', overflow: 'hidden' }}>
                {images[activeImage] ? (
                  <img src={images[activeImage]} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <PlaceholderImg />
                )}
                {discount > 0 && (
                  <div style={{ position: 'absolute', bottom: '1rem', right: '1rem', background: 'var(--red)', color: 'var(--white)', fontSize: '0.7rem', fontWeight: 600, padding: '0.25rem 0.6rem', borderRadius: 1 }}>
                    -{discount}%
                  </div>
                )}
                {product.status === 'LOW' && (
                  <div style={{ position: 'absolute', top: '1rem', left: '1rem', background: '#d97706', color: 'var(--white)', fontSize: '0.65rem', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '0.3rem 0.7rem', borderRadius: 1 }}>
                    Low Stock
                  </div>
                )}
              </div>
              {images.length > 1 && (
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(images.length, 4)}, 1fr)`, gap: '0.75rem' }}>
                  {images.slice(0, 4).map((img, i) => (
                    <button key={i} onClick={() => setActiveImage(i)} style={{ aspectRatio: '1', background: 'var(--red-light)', border: `2px solid ${activeImage === i ? 'var(--red)' : 'var(--border)'}`, borderRadius: 3, cursor: 'pointer', overflow: 'hidden', padding: 0, transition: 'border-color 0.2s' }}>
                      <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--red)', marginBottom: '0.75rem' }}>
                {product.category}
              </div>
              <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--ink)', lineHeight: 1.1, marginBottom: '1rem' }}>
                {product.title}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <StarRating rating={Math.round(product.rating)} readonly size="sm" />
                <span style={{ fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
                  {product.rating.toFixed(1)} ({product.totalSales.toLocaleString()} sold)
                </span>
                <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 500 }}>✓ In stock</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '2rem' }}>
                <span style={{ fontFamily: 'var(--serif)', fontSize: '2.2rem', fontWeight: 900, color: 'var(--red)', lineHeight: 1 }}>
                  ${product.price.toFixed(2)}
                </span>
                {product.originalPrice > product.price && (
                  <>
                    <span style={{ fontSize: '1rem', color: 'var(--ink-faint)', textDecoration: 'line-through', fontWeight: 300 }}>
                      ${product.originalPrice.toFixed(2)}
                    </span>
                    <span style={{ background: 'var(--red)', color: 'var(--white)', fontSize: '0.72rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: 1 }}>
                      -{discount}% OFF
                    </span>
                  </>
                )}
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{ width: 36, height: 44, background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: 'var(--ink)', transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--red-light)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>−</button>
                  <span style={{ width: 36, textAlign: 'center', fontSize: '0.88rem', fontWeight: 500, color: 'var(--ink)' }}>{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} style={{ width: 36, height: 44, background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: 'var(--ink)', transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--red-light)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>+</button>
                </div>
                <button onClick={handleAddToCart} disabled={adding} style={{ flex: 1, padding: '0 1.5rem', height: 44, background: added ? 'var(--red-deep)' : 'var(--red)', color: 'var(--white)', border: 'none', borderRadius: 2, fontSize: '0.88rem', fontWeight: 500, cursor: adding ? 'not-allowed' : 'pointer', fontFamily: 'var(--sans)', letterSpacing: '0.03em', transition: 'background 0.2s', boxShadow: '0 4px 18px rgba(196,30,58,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  {added ? (
                    <><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 7l3.5 3.5L12 4" /></svg> Added!</>
                  ) : adding ? 'Adding…' : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 1h2l2.4 7.2A1.5 1.5 0 0 0 6.9 9H11a1.5 1.5 0 0 0 1.5-1.2L13.5 4H4" /><circle cx="6.5" cy="12" r="0.8" /><circle cx="11.5" cy="12" r="0.8" /></svg>
                      Add to cart — ${(product.price * quantity).toFixed(2)}
                    </>
                  )}
                </button>
                <button style={{ width: 44, height: 44, border: '1.5px solid var(--border)', borderRadius: 2, background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-faint)', transition: 'border-color 0.2s, color 0.2s' }} onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--red)'; e.currentTarget.style.color = 'var(--red)'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--ink-faint)'; }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 14S1 9.5 1 5a4 4 0 0 1 7-2.65A4 4 0 0 1 15 5c0 4.5-7 9-7 9z" /></svg>
                </button>
                {/* Compare button */}
                {(() => {
                  const compareProduct = {
                    id: product.id,
                    slug: product.slug,
                    name: product.title,
                    category: product.category,
                    price: product.price,
                    originalPrice: product.originalPrice > product.price ? product.originalPrice : undefined,
                    rating: Math.round(product.rating),
                    reviewCount: product.totalSales,
                    imageUrl: Array.isArray(product.imagesJson) ? (product.imagesJson as string[])[0] : undefined,
                    badge: product.status === 'LOW' ? 'Low stock' : undefined,
                  };
                  const sel = isSelected(product.id);
                  return (
                    <button
                      onClick={() => {
                        if (!sel && isAtMax) { setAtMax(true); setTimeout(() => setAtMax(false), 1600); return; }
                        toggle(compareProduct);
                      }}
                      title={atMax && !sel ? 'Max 3 products' : sel ? 'Remove from comparison' : 'Add to comparison'}
                      style={{ height: 44, padding: '0 0.85rem', border: `1.5px solid ${sel ? 'var(--ink)' : atMax && !sel ? 'var(--red)' : 'var(--border)'}`, borderRadius: 2, background: sel ? 'var(--ink)' : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', fontWeight: sel ? 500 : 400, color: sel ? 'var(--white)' : atMax && !sel ? 'var(--red)' : 'var(--ink-faint)', fontFamily: 'var(--sans)', transition: 'all 0.18s', whiteSpace: 'nowrap' }}
                    >
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="1" y="1" width="4" height="11" rx="1" /><rect x="8" y="4" width="4" height="8" rx="1" /></svg>
                      {atMax && !sel ? 'Max 3' : sel ? 'Comparing' : 'Compare'}
                    </button>
                  );
                })()}
              </div>
              <div style={{ display: 'flex', gap: '1rem', padding: '1rem', background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 2, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                {[
                  { icon: '🚚', text: 'Ships within 2.4h · 5–8 business days' },
                  { icon: '↩️', text: '7-day hassle-free returns' },
                  { icon: '🔒', text: 'Secure checkout' },
                ].map((b) => (
                  <div key={b.text} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--ink-muted)', flex: '1 1 160px' }}>
                    <span>{b.icon}</span><span>{b.text}</span>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '1.25rem' }}>
                  {(['description', 'shipping'] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)} style={{ padding: '0.6rem 1rem', background: 'none', border: 'none', borderBottom: `2px solid ${tab === t ? 'var(--red)' : 'transparent'}`, fontSize: '0.8rem', fontWeight: tab === t ? 500 : 300, color: tab === t ? 'var(--red)' : 'var(--ink-muted)', cursor: 'pointer', fontFamily: 'var(--sans)', textTransform: 'capitalize', transition: 'all 0.2s', marginBottom: -1 }}>
                      {t}
                    </button>
                  ))}
                </div>
                {tab === 'description' && (
                  <p style={{ fontSize: '0.88rem', color: 'var(--ink-muted)', lineHeight: 1.75, fontWeight: 300 }}>
                    {product.description || 'No description available.'}
                  </p>
                )}
                {tab === 'shipping' && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', lineHeight: 1.75, fontWeight: 300 }}>
                    <p><strong style={{ color: 'var(--ink)' }}>Processing:</strong> Orders dispatched within 2.4 hours on average.</p>
                    <p style={{ marginTop: '0.5rem' }}><strong style={{ color: 'var(--ink)' }}>Delivery:</strong> 5–8 business days to most countries via tracked courier.</p>
                    <p style={{ marginTop: '0.5rem' }}><strong style={{ color: 'var(--ink)' }}>Returns:</strong> 7-day hassle-free returns. Contact support to initiate.</p>
                    <p style={{ marginTop: '0.5rem' }}><strong style={{ color: 'var(--ink)' }}>Tracking:</strong> SMS and email updates at every milestone.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <ReviewList productId={product.id} />
      </main>

      <Footer />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 900px) {
          .product-grid { grid-template-columns: 1fr !important; gap: 2rem !important; }
        }
      `}</style>
    </>
  );
}
