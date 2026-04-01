'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://zyloshipping.com';
const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:4000';

const CATEGORY_META: Record<string, { title: string; description: string; h1: string; intro: string; keywords: string[] }> = {
  electronics: {
    title: 'Electronics & Gadgets — Shop Online USA | ZyloShipping',
    description: 'Shop the best electronics and gadgets online in the USA. Fast shipping, verified products, and unbeatable prices on smart home devices, accessories, and more.',
    h1: 'Electronics & Gadgets',
    intro: 'Discover top-rated electronics shipped fast across the US. From smart home devices to phone accessories — all products verified with real supplier margins.',
    keywords: ['buy electronics online USA', 'gadgets online US', 'cheap electronics free shipping'],
  },
  'home-garden': {
    title: 'Home & Garden Products — Shop Online USA | ZyloShipping',
    description: 'Shop premium home and garden products online in the US. Kitchen gadgets, décor, and outdoor accessories with fast US shipping.',
    h1: 'Home & Garden',
    intro: 'Upgrade your home with top-selling home and garden products. Curated for American households, with fast 5–8 day delivery nationwide.',
    keywords: ['home products online USA', 'garden accessories US', 'home decor free shipping'],
  },
  fashion: {
    title: 'Fashion & Apparel — Buy Online USA | ZyloShipping',
    description: 'Shop trending fashion and apparel online in the USA. Clothing, accessories, and footwear shipped fast with easy 7-day returns.',
    h1: 'Fashion & Apparel',
    intro: 'Trending fashion for every style. All clothing and accessories are quality-checked and ship within 2.4 hours of ordering.',
    keywords: ['fashion online USA', 'buy clothing online US', 'apparel free shipping America'],
  },
  beauty: {
    title: 'Beauty & Personal Care — Shop Online USA | ZyloShipping',
    description: 'Shop beauty and personal care products online in the US. Skincare, makeup, and wellness products with fast free shipping.',
    h1: 'Beauty & Personal Care',
    intro: 'Discover best-selling beauty products trusted by thousands of US customers. Skincare, cosmetics, and wellness essentials at competitive prices.',
    keywords: ['beauty products online USA', 'skincare buy online US', 'cosmetics free shipping'],
  },
  sports: {
    title: 'Sports & Fitness Equipment — Shop Online USA | ZyloShipping',
    description: 'Buy sports and fitness equipment online in the USA. Home gym gear, outdoor sports, and recovery tools with fast US shipping.',
    h1: 'Sports & Fitness',
    intro: 'Build your home gym or upgrade your outdoor gear. All sports and fitness products ship within 5–8 business days across the US.',
    keywords: ['sports equipment online USA', 'fitness gear US', 'buy home gym equipment America'],
  },
  toys: {
    title: 'Toys & Games — Shop Online USA | ZyloShipping',
    description: 'Shop toys and games online in the USA. Educational toys, STEM kits, and kids\' games with fast US shipping and easy returns.',
    h1: 'Toys & Games',
    intro: 'Safe, quality toys for every age group. From STEM educational kits to outdoor play — all products verified and shipped fast across America.',
    keywords: ['toys online USA', 'kids toys buy online US', 'educational toys free shipping'],
  },
  kitchen: {
    title: 'Kitchen & Cooking Products — Shop Online USA | ZyloShipping',
    description: 'Shop kitchen and cooking products online in the US. Appliances, cookware, and gadgets with fast free shipping to your door.',
    h1: 'Kitchen & Cooking',
    intro: 'Level up your kitchen with top-rated cooking tools and appliances. Curated for American kitchens, shipped in 5–8 business days.',
    keywords: ['kitchen products online USA', 'buy cookware online US', 'kitchen gadgets free shipping'],
  },
};

interface Product { id: string; slug: string; name: string; title?: string; category: string; price: number; originalPrice: number; rating: number; badge?: string; imageUrl?: string; storefront?: { imageUrl?: string } }

async function fetchCategoryProducts(category: string): Promise<Product[]> {
  try {
    const res = await fetch(`${API_BASE}/api/products?category=${encodeURIComponent(category)}&limit=24`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.products || [];
  } catch {
    return [];
  }
}

export default function CategoryPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const meta = CATEGORY_META[slug];
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!meta) return;
    fetchCategoryProducts(slug).then((data) => {
      setProducts(data);
      setLoading(false);
    });
  }, [slug, meta]);

  if (!meta) {
    return (
      <>
        <Header />
        <div style={{ padding: '5rem', textAlign: 'center', fontFamily: 'var(--sans)' }}>Category not found.</div>
        <Footer />
      </>
    );
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: meta.h1,
    description: meta.description,
    url: `${BASE_URL}/category/${slug}`,
    provider: { '@type': 'Organization', name: 'ZyloShipping' },
  };

  const relatedCategories = Object.keys(CATEGORY_META).filter(s => s !== slug).slice(0, 5);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header />
      <main style={{ paddingTop: '5rem', background: 'var(--off-white)', minHeight: '100vh' }}>

        {/* Breadcrumb */}
        <nav style={{ padding: '1rem 4vw', borderBottom: '1px solid var(--border)', background: 'var(--white)', fontSize: '0.78rem', color: 'var(--ink-faint)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Link href="/" style={{ color: 'var(--ink-faint)', textDecoration: 'none' }}>Home</Link>
          <span>›</span>
          <Link href="/products" style={{ color: 'var(--ink-faint)', textDecoration: 'none' }}>Products</Link>
          <span>›</span>
          <span style={{ color: 'var(--ink)' }}>{meta.h1}</span>
        </nav>

        {/* Hero */}
        <section style={{ background: 'var(--white)', borderBottom: '1px solid var(--border)', padding: '3rem 4vw 2.5rem' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--red)', marginBottom: '0.6rem' }}>Category</div>
            <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, color: 'var(--ink)', letterSpacing: '-0.03em', marginBottom: '0.75rem', lineHeight: 1.1 }}>
              {meta.h1}
            </h1>
            <p style={{ fontSize: '1rem', color: 'var(--ink-muted)', fontWeight: 300, lineHeight: 1.7, maxWidth: 640 }}>{meta.intro}</p>
          </div>
        </section>

        {/* Products Grid */}
        <section style={{ padding: '2.5rem 4vw 4rem' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--ink-faint)', fontSize: '0.9rem' }}>
                <p>Loading products…</p>
              </div>
            ) : products.length > 0 ? (
              <>
                <div style={{ fontSize: '0.8rem', color: 'var(--ink-faint)', marginBottom: '1.5rem' }}>
                  {products.length} products found
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem' }}>
                  {products.map((p) => {
                    const img = p.imageUrl || p.storefront?.imageUrl;
                    const name = p.title || p.name;
                    const discount = p.originalPrice > p.price
                      ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
                      : 0;
                    return (
                      <Link key={p.id} href={`/products/${p.slug}`} style={{ textDecoration: 'none', background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, overflow: 'hidden', display: 'block', transition: 'box-shadow 0.2s, transform 0.2s' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 40px rgba(0,0,0,0.07)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}
                      >
                        <div style={{ aspectRatio: '1', background: 'var(--red-light)', position: 'relative', overflow: 'hidden' }}>
                          {img ? <img src={img} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <svg viewBox="0 0 60 60" width="60" height="60" fill="none"><rect x="8" y="15" width="44" height="33" rx="2" fill="var(--red-mid)" opacity="0.4"/><circle cx="30" cy="31" r="8" fill="var(--red)" opacity="0.25"/></svg>
                            </div>
                          )}
                          {discount > 0 && <div style={{ position: 'absolute', top: '0.5rem', left: '0.5rem', background: 'var(--red)', color: 'white', fontSize: '0.65rem', fontWeight: 600, padding: '0.2rem 0.4rem', borderRadius: 1 }}>-{discount}%</div>}
                          {p.badge && <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'var(--ink)', color: 'white', fontSize: '0.62rem', fontWeight: 500, padding: '0.2rem 0.5rem', borderRadius: 1, letterSpacing: '0.05em' }}>{p.badge}</div>}
                        </div>
                        <div style={{ padding: '1rem' }}>
                          <div style={{ fontSize: '0.68rem', color: 'var(--ink-faint)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.3rem' }}>{p.category}</div>
                          <h3 style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--ink)', lineHeight: 1.4, marginBottom: '0.6rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{name}</h3>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                            <span style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', fontWeight: 900, color: 'var(--red)' }}>${p.price.toFixed(2)}</span>
                            {p.originalPrice > p.price && <span style={{ fontSize: '0.78rem', color: 'var(--ink-faint)', textDecoration: 'line-through' }}>${p.originalPrice.toFixed(2)}</span>}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
                <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
                  <Link href={`/products?category=${meta.h1}`} style={{ display: 'inline-block', border: '1.5px solid var(--red)', color: 'var(--red)', padding: '0.75rem 2rem', borderRadius: 2, textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>
                    See All {meta.h1} Products →
                  </Link>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--ink-faint)', fontSize: '0.9rem' }}>
                <p style={{ marginBottom: '1rem' }}>No products found in this category.</p>
                <Link href="/products" style={{ color: 'var(--red)', textDecoration: 'none' }}>Browse all products →</Link>
              </div>
            )}
          </div>
        </section>

        {/* Related Categories */}
        <section style={{ background: 'var(--white)', borderTop: '1px solid var(--border)', padding: '2.5rem 4vw' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <h2 style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '1rem' }}>Browse Other Categories</h2>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {relatedCategories.map(cat => (
                <Link key={cat} href={`/category/${cat}`} style={{ padding: '0.5rem 1rem', border: '1px solid var(--border)', borderRadius: 2, textDecoration: 'none', fontSize: '0.82rem', color: 'var(--ink-muted)', transition: 'all 0.15s', textTransform: 'capitalize' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--red)'; (e.currentTarget as HTMLElement).style.color = 'var(--red)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--ink-muted)'; }}
                >
                  {CATEGORY_META[cat]?.h1 || cat}
                </Link>
              ))}
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
