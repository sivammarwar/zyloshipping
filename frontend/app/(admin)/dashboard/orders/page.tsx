'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Order {
  id: string;
  orderNumber: string;
  user: { name: string; email: string };
  items: any[];
  totalAmount: number;
  paymentMethod: string;
  paymentGateway: string;
  status: string;
  supplier?: { name: string };
  createdAt: string;
}

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: '◈' },
  { label: 'Orders', href: '/dashboard/orders', icon: '📦', active: true },
  { label: 'Products', href: '/dashboard/products', icon: '🏷' },
  { label: 'Suppliers', href: '/dashboard/suppliers', icon: '🔗' },
  { label: 'Analytics', href: '/dashboard/analytics', icon: '📊' },
  { label: 'AI Agents', href: '/dashboard/agents', icon: '🤖' },
  { label: 'Settings', href: '/dashboard/settings', icon: '⚙️' },
];

const STATUSES = ['All', 'PENDING', 'PROCESSING', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'];
const GATEWAYS = ['All', 'STRIPE', 'RAZORPAY', 'UPI'];

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'Pending', color: '#6b7280', bg: '#f3f4f6' },
  PROCESSING: { label: 'Processing', color: '#7c3aed', bg: '#f5f3ff' },
  SHIPPED: { label: 'Shipped', color: '#2563eb', bg: '#eff6ff' },
  IN_TRANSIT: { label: 'In Transit', color: '#d97706', bg: '#fef3c7' },
  DELIVERED: { label: 'Delivered', color: '#16a34a', bg: '#f0fdf4' },
  CANCELLED: { label: 'Cancelled', color: '#6b7280', bg: '#f3f4f6' },
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [gateway, setGateway] = useState('All');
  const [selected, setSelected] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    setToken(storedToken);
  }, []);

  useEffect(() => {
    if (!token) return;

    async function fetchOrders() {
      setLoading(true);
      try {
        const response = await api.admin.orders.list({
          search: search || undefined,
          status: status !== 'All' ? status : undefined,
          gateway: gateway !== 'All' ? gateway : undefined,
        }, token as string);

        setOrders(response.orders || []);
      } catch (error) {
        console.error('Failed to fetch orders:', error);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [token, search, status, gateway]);

  const filtered = useMemo(() => {
    let list = [...orders];
    if (search) list = list.filter(o => o.orderNumber.toLowerCase().includes(search.toLowerCase()) || o.user.name.toLowerCase().includes(search.toLowerCase()) || o.user.email.toLowerCase().includes(search.toLowerCase()));
    if (status !== 'All') list = list.filter(o => o.status === status);
    if (gateway !== 'All') list = list.filter(o => o.paymentGateway === gateway);
    return list;
  }, [orders, search, status, gateway]);

  function toggleAll() { setSelected(selected.length === filtered.length ? [] : filtered.map(o => o.id)); }
  function toggleOne(id: string) { setSelected(sel => sel.includes(id) ? sel.filter(s => s !== id) : [...sel, id]); }

  const totalRevenue = orders.reduce((s, o) => s + o.totalAmount, 0);
  const processing = orders.filter(o => o.status === 'PROCESSING').length;
  const inTransit = orders.filter(o => o.status === 'IN_TRANSIT' || o.status === 'SHIPPED').length;
  const delivered = orders.filter(o => o.status === 'DELIVERED').length;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--off-white)', fontFamily: 'var(--sans)' }}>

      {/* Sidebar */}
      <aside style={{ width: sidebarOpen ? 220 : 64, background: 'var(--ink)', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50, transition: 'width 0.25s', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
          <div style={{ width: 32, height: 32, background: 'var(--red)', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontFamily: 'var(--serif)', fontWeight: 900, color: 'white', fontSize: '1rem' }}>Z</span>
          </div>
          {sidebarOpen && <span style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', fontWeight: 900, color: 'white', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>Zylo<span style={{ color: 'var(--red)' }}>.</span></span>}
        </div>
        <nav style={{ flex: 1, padding: '1rem 0', overflowY: 'auto' }}>
          {NAV_ITEMS.map(item => (
            <Link key={item.href} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.7rem 1.25rem', color: item.active ? 'var(--white)' : 'rgba(255,255,255,0.45)', background: item.active ? 'rgba(196,30,58,0.18)' : 'transparent', borderLeft: `3px solid ${item.active ? 'var(--red)' : 'transparent'}`, textDecoration: 'none', fontSize: '0.84rem', fontWeight: item.active ? 500 : 300, whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
              <span style={{ fontSize: '1rem', flexShrink: 0 }}>{item.icon}</span>
              {sidebarOpen && item.label}
            </Link>
          ))}
        </nav>
        <button onClick={() => setSidebarOpen(v => !v)} style={{ margin: '1rem', padding: '0.6rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2, color: 'rgba(255,255,255,0.45)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ transform: sidebarOpen ? 'rotate(0)' : 'rotate(180deg)', transition: 'transform 0.25s' }}><path d="M9 2L4 7l5 5"/></svg>
        </button>
      </aside>

      <main style={{ marginLeft: sidebarOpen ? 220 : 64, flex: 1, transition: 'margin-left 0.25s', minHeight: '100vh' }}>

        {/* Top bar */}
        <div style={{ background: 'var(--white)', borderBottom: '1px solid var(--border)', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 40, flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--red)' }}>Admin</div>
            <h1 style={{ fontFamily: 'var(--serif)', fontSize: '1.4rem', fontWeight: 900, color: 'var(--ink)', letterSpacing: '-0.02em' }}>Orders</h1>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button style={{ padding: '0.55rem 1rem', background: 'none', border: '1px solid var(--border)', borderRadius: 2, fontSize: '0.8rem', color: 'var(--ink-muted)', cursor: 'pointer', fontFamily: 'var(--sans)' }}>
              ↓ Export CSV
            </button>
            <button style={{ padding: '0.55rem 1.1rem', background: 'var(--red)', color: 'white', border: 'none', borderRadius: 2, fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--sans)' }}>
              + Create order
            </button>
          </div>
        </div>

        <div style={{ padding: '2rem' }}>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'Total Orders', val: orders.length },
              { label: 'Processing', val: processing },
              { label: 'In Transit', val: inTransit },
              { label: 'Delivered', val: delivered },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '1.25rem 1.5rem' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '0.35rem' }}>{s.label}</div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: '1.8rem', fontWeight: 900, color: 'var(--ink)', lineHeight: 1 }}>{s.val}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '1rem 1.25rem', marginBottom: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
              <svg style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-faint)' }} width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="6" cy="6" r="4.5"/><path d="M10 10l2.5 2.5"/></svg>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by order ID, customer…" style={{ width: '100%', padding: '0.5rem 0.75rem 0.5rem 2.1rem', border: '1px solid var(--border)', borderRadius: 2, fontSize: '0.82rem', fontFamily: 'var(--sans)', outline: 'none', boxSizing: 'border-box' }} onFocus={e => e.currentTarget.style.borderColor = 'var(--red)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'} />
            </div>
            <select value={status} onChange={e => setStatus(e.target.value)} style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--border)', borderRadius: 2, fontSize: '0.82rem', fontFamily: 'var(--sans)', color: 'var(--ink)', background: 'var(--white)', outline: 'none', cursor: 'pointer' }}>
              {STATUSES.map(s => <option key={s}>{s === 'All' ? 'All Statuses' : STATUS_STYLE[s]?.label ?? s}</option>)}
            </select>
            <select value={gateway} onChange={e => setGateway(e.target.value)} style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--border)', borderRadius: 2, fontSize: '0.82rem', fontFamily: 'var(--sans)', color: 'var(--ink)', background: 'var(--white)', outline: 'none', cursor: 'pointer' }}>
              {GATEWAYS.map(g => <option key={g}>{g === 'All' ? 'All Gateways' : g}</option>)}
            </select>
            <span style={{ fontSize: '0.75rem', color: 'var(--ink-faint)', marginLeft: 'auto' }}>{filtered.length} orders</span>
          </div>

          {/* Bulk actions */}
          {selected.length > 0 && (
            <div style={{ background: 'var(--red-light)', border: '1px solid var(--red-mid)', borderRadius: 2, padding: '0.65rem 1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--red)', fontWeight: 500 }}>{selected.length} selected</span>
              {['Mark Shipped', 'Mark Delivered', 'Export'].map(a => (
                <button key={a} style={{ padding: '0.35rem 0.8rem', background: 'none', border: '1px solid var(--red-mid)', borderRadius: 2, fontSize: '0.75rem', color: 'var(--red)', cursor: 'pointer', fontFamily: 'var(--sans)' }}>{a}</button>
              ))}
              <button onClick={() => setSelected([])} style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)' }}>Clear</button>
            </div>
          )}

          {/* Table */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, overflow: 'hidden' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--ink-faint)' }}>Loading orders...</div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: '1.3rem', color: 'var(--ink-faint)', marginBottom: '0.5rem' }}>No orders found</div>
                <p style={{ fontSize: '0.85rem', color: 'var(--ink-faint)' }}>Orders will appear here once customers start purchasing</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '0.6rem 0.75rem', borderBottom: '1px solid var(--border)', background: 'var(--off-white)', width: 36 }}>
                        <input type="checkbox" checked={selected.length === filtered.length && filtered.length > 0} onChange={toggleAll} style={{ cursor: 'pointer', accentColor: 'var(--red)' }} />
                      </th>
                      {['Order ID', 'Customer', 'Items', 'Total', 'Payment', 'Gateway', 'Status', 'Supplier', 'Time', ''].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '0.6rem 0.75rem', fontSize: '0.64rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-faint)', borderBottom: '1px solid var(--border)', background: 'var(--off-white)', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(o => {
                      const s = STATUS_STYLE[o.status] || { label: o.status, color: '#6b7280', bg: '#f3f4f6' };
                      return (
                        <tr key={o.id} style={{ borderBottom: '1px solid var(--border)', background: selected.includes(o.id) ? 'var(--red-light)' : 'transparent', transition: 'background 0.15s' }} onMouseEnter={e => { if (!selected.includes(o.id)) e.currentTarget.style.background = 'var(--off-white)'; }} onMouseLeave={e => { if (!selected.includes(o.id)) e.currentTarget.style.background = 'transparent'; }}>
                          <td style={{ padding: '0.8rem 0.75rem' }}>
                            <input type="checkbox" checked={selected.includes(o.id)} onChange={() => toggleOne(o.id)} style={{ cursor: 'pointer', accentColor: 'var(--red)' }} />
                          </td>
                          <td style={{ padding: '0.8rem 0.75rem', fontFamily: 'var(--serif)', fontWeight: 700, color: 'var(--ink)', fontSize: '0.85rem' }}>#{o.orderNumber}</td>
                          <td style={{ padding: '0.8rem 0.75rem' }}>
                            <div style={{ fontWeight: 500, color: 'var(--ink)', lineHeight: 1.3 }}>{o.user?.name || 'Unknown'}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--ink-faint)', marginTop: '0.1rem' }}>{o.user?.email || 'N/A'}</div>
                          </td>
                          <td style={{ padding: '0.8rem 0.75rem', color: 'var(--ink-faint)' }}>{o.items?.length || 0}</td>
                          <td style={{ padding: '0.8rem 0.75rem', fontFamily: 'var(--serif)', fontWeight: 700, color: 'var(--red)' }}>${o.totalAmount}</td>
                          <td style={{ padding: '0.8rem 0.75rem', color: 'var(--ink-muted)', fontSize: '0.78rem' }}>{o.paymentMethod}</td>
                          <td style={{ padding: '0.8rem 0.75rem', color: 'var(--ink-muted)', fontSize: '0.78rem' }}>{o.paymentGateway}</td>
                          <td style={{ padding: '0.8rem 0.75rem' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 500, padding: '0.2rem 0.5rem', borderRadius: 1, background: s.bg, color: s.color, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{s.label}</span>
                          </td>
                          <td style={{ padding: '0.8rem 0.75rem', color: 'var(--ink-muted)', fontSize: '0.78rem' }}>{o.supplier?.name || 'N/A'}</td>
                          <td style={{ padding: '0.8rem 0.75rem', color: 'var(--ink-faint)', fontSize: '0.72rem' }}>{new Date(o.createdAt).toLocaleString()}</td>
                          <td style={{ padding: '0.8rem 0.75rem' }}>
                            <button style={{ padding: '0.3rem 0.6rem', background: 'none', border: '1px solid var(--border)', borderRadius: 2, fontSize: '0.7rem', color: 'var(--ink-muted)', cursor: 'pointer', fontFamily: 'var(--sans)', transition: 'all 0.15s', whiteSpace: 'nowrap' }} onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--red)'; e.currentTarget.style.color = 'var(--red)'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--ink-muted)'; }}>View</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                
                {/* Pagination */}
                <div style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--ink-faint)' }}>
                  <span>Showing {filtered.length} orders</span>
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