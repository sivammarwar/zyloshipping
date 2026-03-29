'use client';

import { useState, useEffect, useMemo } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ProductCard, { ProductCardData } from '@/components/store/ProductCard';
import { api } from '@/lib/api';

const CATEGORIES = ['All', 'Electronics', 'Home Decor', 'Gadgets', 'Fashion', 'Fitness'];
const SORT_OPTIONS = [
  { label: 'Featured', value: 'featured' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Top Rated', value: 'rating' },
  { label: 'Most Reviewed', value: 'reviews' },
  { label: 'Newest', value: 'newest' },
];

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('featured');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200]);
  const [freeShipping, setFreeShipping] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const sortMap: Record<string, { sortBy: string; sortDir: string }> = {
          price_asc: { sortBy: 'price', sortDir: 'asc' },
          price_desc: { sortBy: 'price', sortDir: 'desc' },
          rating: { sortBy: 'rating', sortDir: 'desc' },
          reviews: { sortBy: 'totalSales', sortDir: 'desc' },
          featured: { sortBy: 'totalSales', sortDir: 'desc' },
        };
        const sortConfig = sortMap[sort] || { sortBy: 'totalSales', sortDir: 'desc' };
        
        const response = await api.products.list({
          page,
          limit: 20,
          search: search || undefined,
          category: category !== 'All' ? category : undefined,
          sortBy: sortConfig.sortBy,
          sortDir: sortConfig.sortDir,
        });
        
        const mapped = response.products?.map((p: any) => p.storefront || {
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
        setTotalPages(response.pagination?.pages || 1);
        
        const uniqueCategories = ['All', ...Array.from(new Set(response.products?.map((p: any) => p.category).filter(Boolean) || []))];
        setCategories(uniqueCategories as string[]);
      } catch (error) {
        console.error('Failed to fetch products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [search, category, sort, page]);

  useEffect(() => {
    const reveals = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } }),
      { threshold: 0.08 }
    );
    reveals.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const filtered = useMemo(() => {
    let list = [...products];
    list = list.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);
    if (freeShipping) list = list.filter((p) => p.price >= 49);
    return list;
  }, [products, priceRange, freeShipping]);

  return (
    <>
      <Header />

      {/* ── Page header ── */}
      <div
        style={{
          paddingTop: '7rem',
          paddingBottom: '3rem',
          paddingLeft: '4vw',
          paddingRight: '4vw',
          background: 'var(--white)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--red)', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ display: 'inline-block', width: 16, height: 1, background: 'var(--red)' }} />
          10,000+ Products
        </div>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontWeight: 900, letterSpacing: '-0.025em', color: 'var(--ink)', lineHeight: 1.08, marginBottom: '1.5rem' }}>
          Browse the catalogue
        </h1>

        {/* Search bar */}
        <div style={{ position: 'relative', maxWidth: 520 }}>
          <svg style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-faint)' }} width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="6.5" cy="6.5" r="4.5" />
            <path d="M10 10l3.5 3.5" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            style={{
              width: '100%',
              padding: '0.75rem 1rem 0.75rem 2.75rem',
              border: '1.5px solid var(--border)',
              borderRadius: 2,
              fontSize: '0.9rem',
              fontFamily: 'var(--sans)',
              background: 'var(--off-white)',
              color: 'var(--ink)',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--red)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)', fontSize: '1rem' }}>×</button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', padding: '0 4vw', gap: '2.5rem', maxWidth: 1400, margin: '0 auto' }}>

        {/* ── Sidebar filters (desktop) ── */}
        <aside
          style={{
            width: 220,
            flexShrink: 0,
            paddingTop: '2.5rem',
            paddingBottom: '4rem',
          }}
          className="filter-sidebar"
        >
          {/* Category filter */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '0.75rem' }}>Category</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  style={{
                    textAlign: 'left',
                    padding: '0.45rem 0.75rem',
                    borderRadius: 2,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontFamily: 'var(--sans)',
                    fontWeight: category === cat ? 500 : 300,
                    background: category === cat ? 'var(--red-light)' : 'transparent',
                    color: category === cat ? 'var(--red)' : 'var(--ink-muted)',
                    transition: 'all 0.15s',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Price range */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '0.75rem' }}>Price Range</div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.7rem', color: 'var(--ink-faint)' }}>Min ($)</label>
                <input
                  type="number"
                  value={priceRange[0]}
                  onChange={(e) => setPriceRange([+e.target.value, priceRange[1]])}
                  min={0}
                  max={priceRange[1]}
                  style={{ width: '100%', padding: '0.4rem 0.5rem', border: '1px solid var(--border)', borderRadius: 2, fontSize: '0.82rem', fontFamily: 'var(--sans)', outline: 'none' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.7rem', color: 'var(--ink-faint)' }}>Max ($)</label>
                <input
                  type="number"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], +e.target.value])}
                  min={priceRange[0]}
                  max={500}
                  style={{ width: '100%', padding: '0.4rem 0.5rem', border: '1px solid var(--border)', borderRadius: 2, fontSize: '0.82rem', fontFamily: 'var(--sans)', outline: 'none' }}
                />
              </div>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--ink-faint)' }}>
              ${priceRange[0]} – ${priceRange[1]}
            </div>
          </div>

          {/* Free shipping toggle */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '0.75rem' }}>Shipping</div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--ink-muted)' }}>
              <div
                onClick={() => setFreeShipping((v) => !v)}
                style={{
                  width: 36,
                  height: 20,
                  borderRadius: 10,
                  background: freeShipping ? 'var(--red)' : 'var(--border)',
                  position: 'relative',
                  transition: 'background 0.2s',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    background: 'var(--white)',
                    top: 3,
                    left: freeShipping ? 19 : 3,
                    transition: 'left 0.2s',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                  }}
                />
              </div>
              Free shipping only
            </label>
          </div>

          {/* Reset */}
          <button
            onClick={() => { setCategory('All'); setPriceRange([0, 200]); setFreeShipping(false); setSearch(''); }}
            style={{ fontSize: '0.78rem', color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--sans)', borderBottom: '1px solid var(--red-mid)', paddingBottom: 2 }}
          >
            Reset filters
          </button>
        </aside>

        {/* ── Main content ── */}
        <main style={{ flex: 1, paddingTop: '2.5rem', paddingBottom: '4rem' }}>

          {/* Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
              <span style={{ fontFamily: 'var(--serif)', fontWeight: 700, color: 'var(--ink)', fontSize: '1rem' }}>{filtered.length}</span> products
              {category !== 'All' && <span> in <strong>{category}</strong></span>}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {/* Mobile filter toggle */}
              <button
                onClick={() => setFilterOpen((v) => !v)}
                className="mobile-filter-btn"
                style={{ display: 'none', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--ink-muted)', background: 'none', border: '1px solid var(--border)', borderRadius: 2, padding: '0.45rem 0.75rem', cursor: 'pointer', fontFamily: 'var(--sans)' }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M1 3h12M3 7h8M5 11h4" />
                </svg>
                Filters
              </button>

              {/* Sort */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--ink-faint)' }}>Sort:</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  style={{ fontSize: '0.82rem', color: 'var(--ink)', fontFamily: 'var(--sans)', border: '1px solid var(--border)', borderRadius: 2, padding: '0.45rem 0.6rem', background: 'var(--white)', outline: 'none', cursor: 'pointer' }}
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Category pills (horizontal scroll on mobile) */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.25rem' }} className="category-pills">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                style={{
                  padding: '0.4rem 1rem',
                  borderRadius: 20,
                  border: `1.5px solid ${category === cat ? 'var(--red)' : 'var(--border)'}`,
                  background: category === cat ? 'var(--red)' : 'transparent',
                  color: category === cat ? 'var(--white)' : 'var(--ink-muted)',
                  fontSize: '0.78rem',
                  fontWeight: category === cat ? 500 : 300,
                  cursor: 'pointer',
                  fontFamily: 'var(--sans)',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.18s',
                  flexShrink: 0,
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--ink-faint)' }}>Loading products...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', color: 'var(--ink-faint)', marginBottom: '0.5rem' }}>No products found</div>
              <p style={{ fontSize: '0.88rem', color: 'var(--ink-faint)' }}>Try adjusting your search or filters</p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '1.25rem',
              }}
            >
              {filtered.map((product, i) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  delayClass={`reveal-delay-${(i % 3) + 1}`}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      <Footer />

      <style>{`
        @media (max-width: 900px) {
          .filter-sidebar { display: none !important; }
          .mobile-filter-btn { display: flex !important; }
        }
        @media (max-width: 640px) {
          .category-pills { -webkit-overflow-scrolling: touch; }
        }
        .category-pills::-webkit-scrollbar { display: none; }
      `}</style>
    </>
  );
}