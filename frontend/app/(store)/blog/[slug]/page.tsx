'use client';

export const dynamic = 'force-dynamic';

import { Metadata, ResolvingMetadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { BLOG_POSTS, getPostBySlug } from '@/lib/blog-posts';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://zyloshipping.com';

export async function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(
  { params }: { params: { slug: string } },
  _parent: ResolvingMetadata
): Promise<Metadata> {
  const post = getPostBySlug(params.slug);
  if (!post) return { title: 'Post Not Found | ZyloShipping' };

  return {
    title: `${post.title} | ZyloShipping Blog`,
    description: post.excerpt,
    keywords: post.keywords,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `${BASE_URL}/blog/${post.slug}`,
      type: 'article',
      publishedTime: post.publishedAt,
      authors: [post.author],
    },
    twitter: { card: 'summary_large_image', title: post.title, description: post.excerpt },
    alternates: { canonical: `${BASE_URL}/blog/${post.slug}` },
  };
}

function renderContent(content: string) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let listBuffer: string[] = [];
  let key = 0;

  function flushList() {
    if (listBuffer.length > 0) {
      elements.push(
        <ul key={key++} style={{ paddingLeft: '1.5rem', marginBottom: '1.5rem' }}>
          {listBuffer.map((item, i) => (
            <li key={i} style={{ fontSize: '0.92rem', color: 'var(--ink-muted)', lineHeight: 1.75, fontWeight: 300, marginBottom: '0.4rem' }}
              dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--ink);font-weight:600">$1</strong>').replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" style="color:var(--red);text-decoration:none;border-bottom:1px solid var(--red-mid)">$1</a>') }}
            />
          ))}
        </ul>
      );
      listBuffer = [];
    }
  }

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { flushList(); continue; }

    if (line.startsWith('### ')) {
      flushList();
      elements.push(<h3 key={key++} style={{ fontFamily: 'var(--serif)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--ink)', margin: '2rem 0 0.75rem', letterSpacing: '-0.01em' }}>{line.slice(4)}</h3>);
    } else if (line.startsWith('## ')) {
      flushList();
      elements.push(<h2 key={key++} style={{ fontFamily: 'var(--serif)', fontSize: '1.6rem', fontWeight: 900, color: 'var(--ink)', margin: '2.5rem 0 1rem', letterSpacing: '-0.02em', paddingBottom: '0.5rem', borderBottom: '2px solid var(--red-light)' }}>{line.slice(3)}</h2>);
    } else if (line.startsWith('- ')) {
      listBuffer.push(line.slice(2));
    } else if (/^\d+\.\s/.test(line)) {
      listBuffer.push(line.replace(/^\d+\.\s/, ''));
    } else if (line.startsWith('|')) {
      flushList();
      if (!line.includes('---')) {
        const cells = line.split('|').filter(Boolean).map(c => c.trim());
        const isHeader = elements[elements.length - 1] === undefined || !(elements[elements.length - 1] as React.ReactElement)?.props?.style?.borderCollapse;
        elements.push(
          <tr key={key++}>
            {cells.map((c, i) => isHeader
              ? <th key={i} style={{ padding: '0.6rem 1rem', background: 'var(--off-white)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--ink)', textAlign: 'left', border: '1px solid var(--border)' }}>{c}</th>
              : <td key={i} style={{ padding: '0.6rem 1rem', fontSize: '0.85rem', color: 'var(--ink-muted)', border: '1px solid var(--border)' }}>{c}</td>
            )}
          </tr>
        );
      }
    } else {
      flushList();
      const html = line
        .replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--ink);font-weight:600">$1</strong>')
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" style="color:var(--red);text-decoration:none;border-bottom:1px solid var(--red-mid)">$1</a>');
      elements.push(<p key={key++} style={{ fontSize: '0.95rem', color: 'var(--ink-muted)', lineHeight: 1.8, fontWeight: 300, marginBottom: '1rem' }} dangerouslySetInnerHTML={{ __html: html }} />);
    }
  }
  flushList();
  return elements;
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug);
  if (!post) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt,
    author: { '@type': 'Organization', name: post.author },
    publisher: { '@type': 'Organization', name: 'ZyloShipping', url: BASE_URL },
    url: `${BASE_URL}/blog/${post.slug}`,
    keywords: post.keywords.join(', '),
  };

  const related = BLOG_POSTS.filter(p => p.slug !== post.slug).slice(0, 3);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header />
      <main style={{ paddingTop: '5rem', background: 'var(--off-white)', minHeight: '100vh' }}>

        {/* Breadcrumb */}
        <nav style={{ padding: '1rem 4vw', borderBottom: '1px solid var(--border)', background: 'var(--white)', fontSize: '0.78rem', color: 'var(--ink-faint)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Link href="/" style={{ color: 'var(--ink-faint)', textDecoration: 'none' }}>Home</Link>
          <span>›</span>
          <Link href="/blog" style={{ color: 'var(--ink-faint)', textDecoration: 'none' }}>Blog</Link>
          <span>›</span>
          <span style={{ color: 'var(--ink)' }}>{post.title.slice(0, 50)}…</span>
        </nav>

        {/* Article */}
        <article style={{ maxWidth: 760, margin: '0 auto', padding: '3rem 4vw 4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--red)', background: 'var(--red-light)', padding: '0.25rem 0.6rem', borderRadius: 2 }}>
              {post.category}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--ink-faint)' }}>{post.readTime}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--ink-faint)' }}>·</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--ink-faint)' }}>
              {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
          </div>

          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, color: 'var(--ink)', lineHeight: 1.15, letterSpacing: '-0.03em', marginBottom: '1.25rem' }}>
            {post.title}
          </h1>

          <p style={{ fontSize: '1.1rem', color: 'var(--ink-muted)', lineHeight: 1.7, fontWeight: 300, marginBottom: '2.5rem', paddingBottom: '2rem', borderBottom: '1px solid var(--border)' }}>
            {post.excerpt}
          </p>

          <div>{renderContent(post.content)}</div>

          {/* CTA in article */}
          <div style={{ background: 'var(--red-light)', border: '1px solid var(--red-mid)', borderRadius: 4, padding: '1.5rem 2rem', marginTop: '3rem', textAlign: 'center' }}>
            <p style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--ink)', marginBottom: '1rem' }}>
              Ready to put this into action?
            </p>
            <Link href="/products" style={{ display: 'inline-block', background: 'var(--red)', color: 'white', padding: '0.75rem 1.75rem', borderRadius: 2, textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>
              Browse Products on ZyloShipping →
            </Link>
          </div>
        </article>

        {/* Related Posts */}
        {related.length > 0 && (
          <section style={{ background: 'var(--white)', borderTop: '1px solid var(--border)', padding: '3rem 4vw' }}>
            <div style={{ maxWidth: 1100, margin: '0 auto' }}>
              <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.4rem', fontWeight: 900, color: 'var(--ink)', marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
                More Articles
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                {related.map(p => (
                  <Link key={p.slug} href={`/blog/${p.slug}`} style={{ textDecoration: 'none', background: 'var(--off-white)', border: '1px solid var(--border)', borderRadius: 4, padding: '1.25rem', display: 'block', transition: 'box-shadow 0.2s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 18px rgba(0,0,0,0.06)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = 'none'}
                  >
                    <div style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--red)', marginBottom: '0.5rem' }}>{p.category}</div>
                    <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.35, marginBottom: '0.5rem' }}>{p.title}</h3>
                    <span style={{ fontSize: '0.78rem', color: 'var(--red)' }}>Read →</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

      </main>
      <Footer />
    </>
  );
}
