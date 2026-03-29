'use client';

import { useState, useEffect, useMemo } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ProductCard, { ProductCardData } from '@/components/store/ProductCard';
import { api } from '@/lib/api';

const SORT_OPTIONS = [
  { label: 'Featured',          value: 'featured'   },
  { label: 'Price: Low → High', value: 'price_asc'  },
  { label: 'Price: High → Low', value: 'price_desc' },
  { label: 'Top Rated',         value: 'rating'     },
  { label: 'Best Sellers',      value: 'reviews'    },
  { label: 'Newest',            value: 'newest'     },
];

export default function ProductsPage() {
  const [products, setProducts]       = useState<ProductCardData[]>([]);
  const [categories, setCategories]   = useState<string[]>(['All']);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [category, setCategory]       = useState('All');
  const [sort, setSort]               = useState('featured');
  const [priceRange, setPriceRange]   = useState<[number, number]>([0, 500]);
  const [freeShipping, setFreeShipping] = useState(false);
  const [page, setPage]               = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [drawerOpen, setDrawerOpen]   = useState(false);

  // Fetch products
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const sortMap: Record<string, { sortBy: string; sortDir: string }> = {
          price_asc:  { sortBy: 'price',      sortDir: 'asc'  },
          price_desc: { sortBy: 'price',      sortDir: 'desc' },
          rating:     { sortBy: 'rating',     sortDir: 'desc' },
          reviews:    { sortBy: 'totalSales', sortDir: 'desc' },
          featured:   { sortBy: 'totalSales', sortDir: 'desc' },
          newest:     { sortBy: 'createdAt',  sortDir: 'desc' },
        };
        const sc = sortMap[sort] || sortMap.featured;

        const response = await api.products.list({
          page, limit: 21,
          search:   search   || undefined,
          category: category !== 'All' ? category : undefined,
          ...sc,
        });

        if (cancelled) return;

        const mapped = (response.products ?? []).map((p: any) => p.storefront || {
          id: p.id, slug: p.slug, name: p.title, category: p.category,
          price: p.price, originalPrice: Math.round(p.price * 2.1),
          rating: Math.min(5, Math.round(p.rating || 0)),
          reviewCount: p.totalSales || 0,
          badge: p.status === 'LOW' ? 'Low stock' : p.totalSales > 2000 ? 'Bestseller' : undefined,
          imageUrl: Array.isArray(p.imagesJson) ? p.imagesJson[0] : undefined,
        });

        setProducts(mapped);
        setTotalPages(response.pagination?.pages || 1);
        const cats = ['All', ...Array.from(new Set(response.products?.map((p: any) => p.category).filter(Boolean) || []))];
        setCategories(cats as string[]);
      } catch (e) {
        console.error(e);
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [search, category, sort, page]);

  // Client-side price + shipping filter
  const filtered = useMemo(() => {
    let list = [...products];
    list = list.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);
    if (freeShipping) list = list.filter(p => p.price >= 49);
    return list;
  }, [products, priceRange, freeShipping]);

  const resetFilters = () => {
    setCategory('All'); setPriceRange([0, 500]); setFreeShipping(false); setSearch(''); setPage(1);
  };

  const activeFilterCount = [
    category !== 'All',
    priceRange[0] > 0 || priceRange[1] < 500,
    freeShipping,
  ].filter(Boolean).length;

  // Sidebar filter content (shared between desktop sidebar and mobile drawer)
  const FilterContent = () => (
    <div>
      {/* Category */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '0.75rem' }}>Category</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => { setCategory(cat); setPage(1); }}
              style={{ textAlign: 'left', padding: '0.45rem 0.75rem', borderRadius: 2, border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'var(--sans)', fontWeight: category === cat ? 500 : 300, background: category === cat ? 'var(--red-light)' : 'transparent', color: category === cat ? 'var(--red)' : 'var(--ink-muted)', transition: 'all 0.15s' }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '0.75rem' }}>Price Range</div>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
          {[
            { label: 'Min', val: priceRange[0], set: (v: number) => setPriceRange([v, priceRange[1]]) },
            { label: 'Max', val: priceRange[1], set: (v: number) => setPriceRange([priceRange[0], v]) },
          ].map(({ label, val, set }) => (
            <div key={label} style={{ flex: 1 }}>
              <label style={{ fontSize: '0.68rem', color: 'var(--ink-faint)', display: 'block', marginBottom: '0.25rem' }}>{label} ($)</label>
              <input
                type="number"
                value={val}
                onChange={e => set(+e.target.value)}
                min={0} max={1000}
                style={{ width: '100%', padding: '0.4rem 0.5rem', border: '1px solid var(--border)', borderRadius: 2, fontSize: '0.82rem', fontFamily: 'var(--sans)', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--red)'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
              />
            </div>
          ))}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--ink-faint)' }}>${priceRange[0]} – ${priceRange[1]}</div>
      </div>

      {/* Free shipping */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '0.75rem' }}>Shipping</div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--ink-muted)' }}>
          <div
            onClick={() => setFreeShipping(v => !v)}
            style={{ width: 36, height: 20, borderRadius: 10, background: freeShipping ? 'var(--red)' : 'var(--border)', position: 'relative', transition: 'background 0.2s', cursor: 'pointer', flexShrink: 0 }}
          >
            <div style={{ position: 'absolute', width: 14, height: 14, borderRadius: '50%', background: 'white', top: 3, left: freeShipping ? 19 : 3, transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }} />
          </div>
          Free shipping (orders $49+)
        </label>
      </div>

      {/* Reset */}
      <button
        onClick={resetFilters}
        style={{ fontSize: '0.78rem', color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--sans)', borderBottom: '1px solid var(--red-mid)', paddingBottom: 2 }}
      >
        Reset filters {activeFilterCount > 0 && `(${activeFilterCount})`}
      </button>
    </div>
  );

  return (
    <>
      <Header />

      {/* Mobile filter drawer backdrop */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 80, backdropFilter: 'blur(2px)' }}
        />
      )}

      {/* Mobile filter drawer */}
      <div style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, width: 300, maxWidth: '85vw',
        background: 'var(--white)', zIndex: 90,
        transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.28s cubic-bezier(0.22, 1, 0.36, 1)',
        overflowY: 'auto', padding: '1.5rem',
        boxShadow: '4px 0 32px rgba(0,0,0,0.1)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <span style={{ fontFamily: 'var(--serif)', fontWeight: 700, color: 'var(--ink)', fontSize: '1.1rem' }}>Filters</span>
          <button onClick={() => setDrawerOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.4rem', color: 'var(--ink-muted)', lineHeight: 1 }}>×</button>
        </div>
        <FilterContent />
        <div style={{ marginTop: '2rem' }}>
          <button
            onClick={() => setDrawerOpen(false)}
            style={{ width: '100%', padding: '0.75rem', background: 'var(--red)', color: 'var(--white)', border: 'none', borderRadius: 2, fontSize: '0.88rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--sans)' }}
          >
            Show {filtered.length} results
          </button>
        </div>
      </div>

      {/* Page header */}
      <div style={{ paddingTop: '7rem', paddingBottom: '3rem', paddingLeft: '4vw', paddingRight: '4vw', background: 'var(--white)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--red)', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ display: 'inline-block', width: 16, height: 1, background: 'var(--red)' }} />
          10,000+ Products
        </div>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontWeight: 900, letterSpacing: '-0.025em', color: 'var(--ink)', lineHeight: 1.08, marginBottom: '1.5rem' }}>
          Browse the catalogue
        </h1>

        {/* Search */}
        <div style={{ position: 'relative', maxWidth: 520 }}>
          <svg style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-faint)', pointerEvents: 'none' }} width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="6.5" cy="6.5" r="4.5" /><path d="M10 10l3.5 3.5" />
          </svg>
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search products…"
            style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', border: '1.5px solid var(--border)', borderRadius: 2, fontSize: '0.9rem', fontFamily: 'var(--sans)', background: 'var(--off-white)', color: 'var(--ink)', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
            onFocus={e => e.currentTarget.style.borderColor = 'var(--red)'}
            onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
          />
          {search && (
            <button onClick={() => { setSearch(''); setPage(1); }} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)', fontSize: '1.1rem', lineHeight: 1 }}>×</button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', padding: '0 4vw', gap: '2.5rem', maxWidth: 1400, margin: '0 auto' }}>

        {/* Desktop sidebar */}
        <aside className="desktop-sidebar" style={{ width: 220, flexShrink: 0, paddingTop: '2.5rem', paddingBottom: '4rem' }}>
          <FilterContent />
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, paddingTop: '2.5rem', paddingBottom: '4rem' }}>

          {/* Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
              <span style={{ fontFamily: 'var(--serif)', fontWeight: 700, color: 'var(--ink)', fontSize: '1rem' }}>{filtered.length}</span> products
              {category !== 'All' && <span> in <strong>{category}</strong></span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {/* Mobile filter button */}
              <button
                onClick={() => setDrawerOpen(true)}
                className="mobile-filter-btn"
                style={{ display: 'none', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--ink-muted)', background: 'none', border: '1px solid var(--border)', borderRadius: 2, padding: '0.45rem 0.75rem', cursor: 'pointer', fontFamily: 'var(--sans)', position: 'relative' }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M1 3h12M3 7h8M5 11h4" /></svg>
                Filters
                {activeFilterCount > 0 && (
                  <span style={{ position: 'absolute', top: -6, right: -6, width: 16, height: 16, borderRadius: '50%', background: 'var(--red)', color: 'var(--white)', fontSize: '0.6rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{activeFilterCount}</span>
                )}
              </button>
              {/* Sort */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--ink-faint)' }}>Sort:</span>
                <select
                  value={sort}
                  onChange={e => { setSort(e.target.value); setPage(1); }}
                  style={{ fontSize: '0.82rem', color: 'var(--ink)', fontFamily: 'var(--sans)', border: '1px solid var(--border)', borderRadius: 2, padding: '0.45rem 0.6rem', background: 'var(--white)', outline: 'none', cursor: 'pointer' }}
                >
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Category pills (mobile scroll) */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.25rem', WebkitOverflowScrolling: 'touch' }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => { setCategory(cat); setPage(1); }}
                style={{ padding: '0.38rem 0.9rem', borderRadius: 20, border: `1.5px solid ${category === cat ? 'var(--red)' : 'var(--border)'}`, background: category === cat ? 'var(--red)' : 'transparent', color: category === cat ? 'var(--white)' : 'var(--ink-muted)', fontSize: '0.78rem', fontWeight: category === cat ? 500 : 300, cursor: 'pointer', fontFamily: 'var(--sans)', whiteSpace: 'nowrap', transition: 'all 0.18s', flexShrink: 0 }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grid */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }} className="product-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ aspectRatio: '0.75', background: 'var(--border)', borderRadius: 4, animation: 'pulse 1.5s ease-in-out infinite' }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', color: 'var(--ink-faint)', marginBottom: '0.5rem' }}>No products found</div>
              <p style={{ fontSize: '0.88rem', color: 'var(--ink-faint)', marginBottom: '1.5rem' }}>Try adjusting your search or filters</p>
              <button onClick={resetFilters} style={{ padding: '0.6rem 1.4rem', background: 'var(--red)', color: 'var(--white)', border: 'none', borderRadius: 2, cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: '0.85rem' }}>Reset all filters</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }} className="product-grid">
              {filtered.map((product, i) => (
                <ProductCard key={product.id} product={product} delayClass={`reveal-delay-${(i % 3) + 1}`} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && !loading && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '3rem', flexWrap: 'wrap' }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '0.5rem 1rem', border: '1px solid var(--border)', borderRadius: 2, background: 'none', cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: '0.82rem', color: page === 1 ? 'var(--ink-faint)' : 'var(--ink)', fontFamily: 'var(--sans)' }}>← Prev</button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const p = totalPages <= 7 ? i + 1 : i === 0 ? 1 : i === 6 ? totalPages : page - 2 + i;
                return (
                  <button key={p} onClick={() => setPage(p)} style={{ width: 34, height: 34, border: `1.5px solid ${p === page ? 'var(--red)' : 'var(--border)'}`, borderRadius: 2, background: p === page ? 'var(--red)' : 'none', color: p === page ? 'var(--white)' : 'var(--ink-muted)', fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'var(--sans)' }}>{p}</button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: '0.5rem 1rem', border: '1px solid var(--border)', borderRadius: 2, background: 'none', cursor: page === totalPages ? 'not-allowed' : 'pointer', fontSize: '0.82rem', color: page === totalPages ? 'var(--ink-faint)' : 'var(--ink)', fontFamily: 'var(--sans)' }}>Next →</button>
            </div>
          )}
        </main>
      </div>

      <Footer />

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @media (max-width: 900px) {
          .desktop-sidebar { display: none !important; }
          .mobile-filter-btn { display: flex !important; }
          .product-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 480px) {
          .product-grid { grid-template-columns: 1fr !important; }
        }
        div::-webkit-scrollbar { display: none; }
      `}</style>
    </>
  );
}