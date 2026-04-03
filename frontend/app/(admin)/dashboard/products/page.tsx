'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Product {
  id: string;
  sku: string;
  title: string;
  category: string;
  supplier: { name: string; id: string };
  supplierCost: number;
  price: number;
  stockQuantity: number;
  status: string;
  totalSales: number;
  rating: number;
}

const STATUSES = ['All', 'ACTIVE', 'LOW', 'HIDDEN', 'DRAFT'];

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: 'Active', color: '#16a34a', bg: '#f0fdf4' },
  low:    { label: 'Low Stock', color: '#d97706', bg: '#fef3c7' },
  hidden: { label: 'Hidden',    color: '#6b7280', bg: '#f3f4f6' },
  draft:  { label: 'Draft',     color: '#7c3aed', bg: '#f5f3ff' },
};

// Seller navigation - NO AI Agents, NO Suppliers (admin-only features)
const SELLER_NAV = [
  { label: 'Dashboard', href: '/dashboard', icon: '◈' },
  { label: 'Orders', href: '/dashboard/orders', icon: '📦' },
  { label: 'Products', href: '/dashboard/products', icon: '🏷', active: true },
  { label: 'Analytics', href: '/dashboard/analytics', icon: '📊' },
  { label: 'Settings', href: '/dashboard/settings', icon: '⚙️' },
];

export default function SellerProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [suppliers, setSuppliers] = useState<string[]>(['All']);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [supplier, setSupplier] = useState('All');
  const [status, setStatus] = useState('All');
  const [selected, setSelected] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'sales' | 'price' | 'stock' | 'name'>('sales');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    setToken(storedToken);
  }, []);

  useEffect(() => {
    if (!token) return;
    
    async function fetchProducts() {
      setLoading(true);
      try {
        const sortByMap: Record<string, string> = {
          sales: 'totalSales',
          price: 'price',
          stock: 'stockQuantity',
          name: 'title',
        };
        
        const response = await api.admin.products.list({
          search: search || undefined,
          category: category !== 'All' ? category : undefined,
          supplier: supplier !== 'All' ? supplier : undefined,
          status: status !== 'All' ? status : undefined,
          sortBy: sortByMap[sortBy],
          sortDir,
        }, token as string);
        
        setProducts(response.products || []);
        
        const uniqueCategories = ['All', ...Array.from(new Set(response.products?.map((p: Product) => p.category).filter(Boolean) || []))];
        setCategories(uniqueCategories as string[]);
        
        const uniqueSuppliers = ['All', ...Array.from(new Set(response.products?.map((p: Product) => p.supplier?.name).filter(Boolean) || []))];
        setSuppliers(uniqueSuppliers as string[]);
      } catch (error) {
        console.error('Failed to fetch products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }
    
    fetchProducts();
  }, [token, search, category, supplier, status, sortBy, sortDir]);

  function toggleSort(col: typeof sortBy) {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('desc'); }
  }

  const filtered = useMemo(() => products, [products]);

  function toggleAll() {
    setSelected(selected.length === filtered.length ? [] : filtered.map(p => p.id));
  }
  function toggleOne(id: string) {
    setSelected(sel => sel.includes(id) ? sel.filter(s => s !== id) : [...sel, id]);
  }

  const SortHeader = ({ col, label }: { col: typeof sortBy; label: string }) => (
    <th
      onClick={() => toggleSort(col)}
      style={{ textAlign: 'left', padding: '0.6rem 0.75rem', fontSize: '0.64rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: sortBy === col ? 'var(--red)' : 'var(--ink-faint)', borderBottom: '1px solid var(--border)', cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none', background: 'var(--off-white)' }}
    >
      {label} {sortBy === col ? (sortDir === 'desc' ? '↓' : '↑') : '↕'}
    </th>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--off-white)', fontFamily: 'var(--sans)' }}>

      {/* Sidebar */}
      <aside style={{ width: sidebarOpen ? 220 : 64, background: 'var(--ink)', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50, transition: 'width 0.25s cubic-bezier(0.22,1,0.36,1)', overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ padding: '1.5rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
          <div style={{ width: 32, height: 32, background: 'var(--red)', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontFamily: 'var(--serif)', fontWeight: 900, color: 'white', fontSize: '1rem' }}>Z</span>
          </div>
          {sidebarOpen && <span style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', fontWeight: 900, color: 'white', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>Zylo<span style={{ color: 'var(--red)' }}>.</span></span>}
        </div>
        <nav style={{ flex: 1, padding: '1rem 0' }}>
          {SELLER_NAV.map(item => (
            <Link key={item.href} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.7rem 1.25rem', color: item.active ? 'var(--white)' : 'rgba(255,255,255,0.45)', background: item.active ? 'rgba(196,30,58,0.18)' : 'transparent', borderLeft: `3px solid ${item.active ? 'var(--red)' : 'transparent'}`, textDecoration: 'none', fontSize: '0.84rem', fontWeight: item.active ? 500 : 300, transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
              <span style={{ fontSize: '1rem', flexShrink: 0 }}>{item.icon}</span>
              {sidebarOpen && item.label}
            </Link>
          ))}
        </nav>
        <button onClick={() => setSidebarOpen(v => !v)} style={{ margin: '1rem', padding: '0.6rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2, color: 'rgba(255,255,255,0.45)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ transform: sidebarOpen ? 'rotate(0)' : 'rotate(180deg)', transition: 'transform 0.25s' }}><path d="M9 2L4 7l5 5"/></svg>
        </button>
      </aside>

      <main style={{ marginLeft: sidebarOpen ? 220 : 64, flex: 1, transition: 'margin-left 0.25s cubic-bezier(0.22,1,0.36,1)', minHeight: '100vh' }}>

        {/* Top bar */}
        <div style={{ background: 'var(--white)', borderBottom: '1px solid var(--border)', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 40, gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--red)' }}>Seller</div>
            <h1 style={{ fontFamily: 'var(--serif)', fontSize: '1.4rem', fontWeight: 900, color: 'var(--ink)', letterSpacing: '-0.02em' }}>Products</h1>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button style={{ padding: '0.55rem 1rem', background: 'none', border: '1px solid var(--border)', borderRadius: 2, fontSize: '0.8rem', color: 'var(--ink-muted)', cursor: 'pointer', fontFamily: 'var(--sans)', transition: 'border-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--red)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
              ↻ Sync suppliers
            </button>
            <button style={{ padding: '0.55rem 1.1rem', background: 'var(--red)', color: 'var(--white)', border: 'none', borderRadius: 2, fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--sans)' }}>
              + Add product
            </button>
          </div>
        </div>

        <div style={{ padding: '2rem' }}>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'Total Products', val: products.length },
              { label: 'Active',         val: products.filter(p => p.status === 'ACTIVE').length },
              { label: 'Low Stock',      val: products.filter(p => p.status === 'LOW').length, warn: true },
              { label: 'Out of Stock',   val: products.filter(p => p.stockQuantity === 0).length, warn: true },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '1rem 1.25rem' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '0.35rem' }}>{s.label}</div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: '1.6rem', fontWeight: 900, color: s.warn && (s.val as number) > 0 ? 'var(--red)' : 'var(--ink)', lineHeight: 1 }}>{s.val}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '1rem 1.25rem', marginBottom: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <svg style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-faint)' }} width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="6" cy="6" r="4.5"/><path d="M10 10l2.5 2.5"/></svg>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products or SKU…" style={{ width: '100%', padding: '0.5rem 0.75rem 0.5rem 2.1rem', border: '1px solid var(--border)', borderRadius: 2, fontSize: '0.82rem', fontFamily: 'var(--sans)', outline: 'none', boxSizing: 'border-box' }} onFocus={e => e.currentTarget.style.borderColor = 'var(--red)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'} />
            </div>
            {/* Selects */}
            {[
              { val: category, set: setCategory, opts: categories, label: 'Category' },
              { val: supplier, set: setSupplier, opts: suppliers,  label: 'Supplier' },
              { val: status,   set: setStatus,   opts: STATUSES,   label: 'Status' },
            ].map(f => (
              <select key={f.label} value={f.val} onChange={e => f.set(e.target.value)} style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--border)', borderRadius: 2, fontSize: '0.82rem', fontFamily: 'var(--sans)', color: 'var(--ink)', background: 'var(--white)', outline: 'none', cursor: 'pointer' }}>
                {f.opts.map(o => <option key={o}>{o === 'All' ? `All ${f.label}` : o}</option>)}
              </select>
            ))}
            <span style={{ fontSize: '0.75rem', color: 'var(--ink-faint)', marginLeft: 'auto' }}>{filtered.length} products</span>
          </div>

          {/* Bulk actions */}
          {selected.length > 0 && (
            <div style={{ background: 'var(--red-light)', border: '1px solid var(--red-mid)', borderRadius: 2, padding: '0.65rem 1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--red)', fontWeight: 500 }}>{selected.length} selected</span>
              {[
                { label: 'Set Active', action: () => {} },
                { label: 'Set Hidden', action: () => {} },
                { label: 'Delete',     action: () => {} },
              ].map(a => (
                <button key={a.label} onClick={a.action} style={{ padding: '0.35rem 0.8rem', background: 'none', border: '1px solid var(--red-mid)', borderRadius: 2, fontSize: '0.75rem', color: 'var(--red)', cursor: 'pointer', fontFamily: 'var(--sans)', transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--red-mid)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                  {a.label}
                </button>
              ))}
              <button onClick={() => setSelected([])} style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)' }}>Clear</button>
            </div>
          )}

          {/* Table */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, overflow: 'hidden' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--ink-faint)' }}>Loading products...</div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: '1.3rem', color: 'var(--ink-faint)', marginBottom: '0.5rem' }}>No products found</div>
                <p style={{ fontSize: '0.85rem', color: 'var(--ink-faint)' }}>Try adjusting your filters or sync products from suppliers</p>
              </div>
            ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '0.6rem 0.75rem', borderBottom: '1px solid var(--border)', background: 'var(--off-white)', width: 36 }}>
                      <input type="checkbox" checked={selected.length === filtered.length && filtered.length > 0} onChange={toggleAll} style={{ cursor: 'pointer', accentColor: 'var(--red)' }} />
                    </th>
                    <th style={{ textAlign: 'left', padding: '0.6rem 0.75rem', fontSize: '0.64rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-faint)', borderBottom: '1px solid var(--border)', background: 'var(--off-white)' }}>SKU</th>
                    <SortHeader col="name"  label="Product" />
                    <th style={{ textAlign: 'left', padding: '0.6rem 0.75rem', fontSize: '0.64rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-faint)', borderBottom: '1px solid var(--border)', background: 'var(--off-white)' }}>Supplier</th>
                    <th style={{ textAlign: 'left', padding: '0.6rem 0.75rem', fontSize: '0.64rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-faint)', borderBottom: '1px solid var(--border)', background: 'var(--off-white)' }}>Status</th>
                    <SortHeader col="stock" label="Stock" />
                    <SortHeader col="price" label="Price" />
                    <th style={{ textAlign: 'left', padding: '0.6rem 0.75rem', fontSize: '0.64rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-faint)', borderBottom: '1px solid var(--border)', background: 'var(--off-white)', whiteSpace: 'nowrap' }}>Margin</th>
                    <SortHeader col="sales" label="Sales" />
                    <th style={{ padding: '0.6rem 0.75rem', borderBottom: '1px solid var(--border)', background: 'var(--off-white)' }} />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => {
                    const margin = Math.round(((p.price - p.supplierCost) / p.price) * 100);
                    const s = STATUS_STYLE[p.status] || { label: p.status, color: '#6b7280', bg: '#f3f4f6' };
                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--border)', background: selected.includes(p.id) ? 'var(--red-light)' : 'transparent', transition: 'background 0.15s' }} onMouseEnter={e => { if (!selected.includes(p.id)) e.currentTarget.style.background = 'var(--off-white)'; }} onMouseLeave={e => { if (!selected.includes(p.id)) e.currentTarget.style.background = 'transparent'; }}>
                        <td style={{ padding: '0.8rem 0.75rem' }}>
                          <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggleOne(p.id)} style={{ cursor: 'pointer', accentColor: 'var(--red)' }} />
                        </td>
                        <td style={{ padding: '0.8rem 0.75rem', color: 'var(--ink-faint)', fontSize: '0.72rem', fontFamily: 'monospace' }}>{p.sku}</td>
                        <td style={{ padding: '0.8rem 0.75rem' }}>
                          <div style={{ fontWeight: 500, color: 'var(--ink)', lineHeight: 1.3, maxWidth: 220 }}>{p.title}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--ink-faint)', marginTop: '0.1rem' }}>{p.category}</div>
                        </td>
                        <td style={{ padding: '0.8rem 0.75rem', color: 'var(--ink-muted)' }}>{p.supplier?.name || 'N/A'}</td>
                        <td style={{ padding: '0.8rem 0.75rem' }}>
                          <span style={{ fontSize: '0.65rem', fontWeight: 500, padding: '0.2rem 0.5rem', borderRadius: 1, background: s.bg, color: s.color, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{s.label}</span>
                        </td>
                        <td style={{ padding: '0.8rem 0.75rem', fontWeight: p.stockQuantity < 10 ? 700 : 400, color: p.stockQuantity === 0 ? '#dc2626' : p.stockQuantity < 10 ? '#d97706' : 'var(--ink)' }}>
                          {p.stockQuantity === 0 ? '—' : p.stockQuantity}
                        </td>
                        <td style={{ padding: '0.8rem 0.75rem' }}>
                          <div style={{ fontFamily: 'var(--serif)', fontWeight: 700, color: 'var(--red)' }}>${p.price}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--ink-faint)' }}>cost ${p.supplierCost}</div>
                        </td>
                        <td style={{ padding: '0.8rem 0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <div style={{ flex: 1, height: 4, background: 'var(--border)', borderRadius: 2, minWidth: 40 }}>
                              <div style={{ height: '100%', background: margin >= 60 ? '#22c55e' : margin >= 40 ? '#f59e0b' : 'var(--red)', borderRadius: 2, width: `${margin}%` }} />
                            </div>
                            <span style={{ fontSize: '0.72rem', color: 'var(--ink-muted)', whiteSpace: 'nowrap' }}>{margin}%</span>
                          </div>
                        </td>
                        <td style={{ padding: '0.8rem 0.75rem', fontFamily: 'var(--serif)', fontWeight: 700, color: 'var(--ink)' }}>
                          {p.totalSales > 0 ? p.totalSales.toLocaleString() : '—'}
                        </td>
                        <td style={{ padding: '0.8rem 0.75rem' }}>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button style={{ padding: '0.3rem 0.6rem', background: 'none', border: '1px solid var(--border)', borderRadius: 2, fontSize: '0.7rem', color: 'var(--ink-muted)', cursor: 'pointer', fontFamily: 'var(--sans)', transition: 'all 0.15s', whiteSpace: 'nowrap' }} onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--red)'; e.currentTarget.style.color = 'var(--red)'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--ink-muted)'; }}>Edit</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {/* Pagination */}
              <div style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--ink-faint)' }}>
                <span>Showing {filtered.length} products</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {['← Prev', '1', '2', '3', 'Next →'].map(p => (
                    <button key={p} style={{ padding: '0.35rem 0.65rem', border: p === '1' ? '1.5px solid var(--red)' : '1px solid var(--border)', borderRadius: 2, background: p === '1' ? 'var(--red-light)' : 'none', color: p === '1' ? 'var(--red)' : 'var(--ink-muted)', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'var(--sans)' }}>{p}</button>
                  ))}
                </div>
              </div>
            </div>
            )}
          </div>
        </div>
      </main>

      <style jsx>{`
        @media (max-width: 900px) {
          main { margin-left: 64px !important; }
        }
      `}</style>
    </div>
  );
}