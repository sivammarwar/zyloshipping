'use client';

export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { BLOG_POSTS } from '@/lib/blog-posts';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://zyloshipping.com';

export const metadata: Metadata = {
  title: 'Blog — E-Commerce Tips, Dropshipping & US Market Trends | ZyloShipping',
  description: 'Expert guides on dropshipping, side hustles, and the best products to sell in the USA. Updated weekly with real market data.',
  keywords: ['dropshipping blog', 'ecommerce tips USA', 'side hustle guide', 'trending products 2026'],
  openGraph: {
    title: 'ZyloShipping Blog — E-Commerce Tips for the US Market',
    description: 'Expert guides on dropshipping, side hustles, and the best products to sell in the USA.',
    url: `${BASE_URL}/blog`,
    type: 'website',
  },
  alternates: { canonical: `${BASE_URL}/blog` },
};

const CATEGORY_COLORS: Record<string, string> = {
  Business: 'var(--red)',
  Technology: '#2563eb',
  Shopping: '#16a34a',
  Trends: '#d97706',
};

export default function BlogIndexPage() {
  return (
    <>
      <Header />
      <main style={{ paddingTop: '5rem', background: 'var(--off-white)', minHeight: '100vh' }}>

        {/* Hero */}
        <section style={{ background: 'var(--white)', borderBottom: '1px solid var(--border)', padding: '4rem 4vw 3rem' }}>
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--red)', marginBottom: '0.75rem' }}>
              ZyloShipping Blog
            </div>
            <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--ink)', lineHeight: 1.1, marginBottom: '1rem' }}>
              E-Commerce Insights for the US Market
            </h1>
            <p style={{ fontSize: '1.05rem', color: 'var(--ink-muted)', lineHeight: 1.7, fontWeight: 300, maxWidth: 600 }}>
              Guides on dropshipping, trending products, side hustles, and smart shopping — all focused on the American market.
            </p>
          </div>
        </section>

        {/* Posts Grid */}
        <section style={{ padding: '3rem 4vw 5rem' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {BLOG_POSTS.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                style={{ textDecoration: 'none', display: 'block', background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, overflow: 'hidden', transition: 'box-shadow 0.2s, transform 0.2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 40px rgba(0,0,0,0.07)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}
              >
                {/* Color bar */}
                <div style={{ height: 4, background: CATEGORY_COLORS[post.category] || 'var(--red)' }} />
                <div style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: CATEGORY_COLORS[post.category] || 'var(--red)' }}>
                      {post.category}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--ink-faint)' }}>{post.readTime}</span>
                  </div>
                  <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.3, marginBottom: '0.75rem', letterSpacing: '-0.01em' }}>
                    {post.title}
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', lineHeight: 1.65, fontWeight: 300, marginBottom: '1.25rem' }}>
                    {post.excerpt}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--ink-faint)' }}>
                      {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--red)', fontWeight: 500 }}>Read →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section style={{ background: 'var(--ink)', padding: '4rem 4vw', textAlign: 'center' }}>
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 900, color: 'var(--white)', marginBottom: '1rem', letterSpacing: '-0.02em' }}>
              Ready to Start Your Store?
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '2rem', fontWeight: 300 }}>
              Browse our AI-curated catalogue of US market-ready products with verified suppliers and built-in margins.
            </p>
            <Link href="/products" style={{ display: 'inline-block', background: 'var(--red)', color: 'var(--white)', padding: '0.9rem 2rem', borderRadius: 2, textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500, letterSpacing: '0.03em' }}>
              Browse Products →
            </Link>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
