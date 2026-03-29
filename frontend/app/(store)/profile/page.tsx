'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getOrders, OrderSummary } from '@/lib/api/orders';
import { getUserFromToken } from '@/lib/tokenManager';
import { clearAuth } from '@/lib/tokenManager';

type Tab = 'overview' | 'orders' | 'addresses' | 'wishlist';

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  IN_TRANSIT:            { label: 'In Transit',   color: '#d97706', bg: '#fef3c7' },
  SHIPPED:               { label: 'Shipped',       color: '#2563eb', bg: '#eff6ff' },
  DELIVERED:             { label: 'Delivered',     color: '#16a34a', bg: '#f0fdf4' },
  COMPLETED:             { label: 'Completed',     color: '#16a34a', bg: '#f0fdf4' },
  PENDING:               { label: 'Pending',       color: 'var(--ink-muted)', bg: 'var(--off-white)' },
  PAYMENT_CONFIRMED:     { label: 'Confirmed',     color: '#7c3aed', bg: '#f5f3ff' },
  SUBMITTED_TO_SUPPLIER: { label: 'Processing',    color: 'var(--red)', bg: 'var(--red-light)' },
  SUPPLIER_CONFIRMED:    { label: 'Confirmed',     color: '#7c3aed', bg: '#f5f3ff' },
  REFUND_REQUESTED:      { label: 'Refund Req.',   color: '#d97706', bg: '#fef3c7' },
  REFUNDED:              { label: 'Refunded',      color: '#6b7280', bg: '#f3f4f6' },
  CANCELLED:             { label: 'Cancelled',     color: '#6b7280', bg: '#f3f4f6' },
};

const MOCK_ADDRESSES = [
  { id: '1', label: 'Home', line1: '123 Oak Street', line2: 'Apt 4B', city: 'New York', state: 'NY', zip: '10001', country: 'United States', default: true },
];

export default function ProfilePage() {
  const router                      = useRouter();
  const [tab, setTab]               = useState<Tab>('overview');
  const [editMode, setEditMode]     = useState(false);
  const [orders, setOrders]         = useState<OrderSummary[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [totalOrders, setTotalOrders]     = useState(0);
  const [totalSpent, setTotalSpent]       = useState(0);
  const [name, setName]             = useState('');
  const [phone, setPhone]           = useState('');
  const [email, setEmail]           = useState('');

  const user = getUserFromToken();

  useEffect(() => {
    if (!user) { router.push('/login?redirect=/profile'); return; }
    setEmail(user.email);
    setName(user.email.split('@')[0]); // fallback until profile API exists

    (async () => {
      try {
        const res = await getOrders({ page: 1, limit: 10 });
        setOrders(res.orders);
        setTotalOrders(res.pagination.total);
        const spent = res.orders.reduce((s, o) => s + o.totalAmount, 0);
        setTotalSpent(spent);
      } catch {
        setOrders([]);
      } finally {
        setOrdersLoading(false);
      }
    })();
  }, [router]);

  function handleLogout() {
    clearAuth();
    router.push('/login');
  }

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: 'overview',  label: 'Overview',  icon: '◈' },
    { key: 'orders',    label: 'Orders',    icon: '📦' },
    { key: 'addresses', label: 'Addresses', icon: '📍' },
    { key: 'wishlist',  label: 'Wishlist',  icon: '♡'  },
  ];

  const initials = name.slice(0, 2).toUpperCase() || 'ZY';

  return (
    <>
      <Header />

      <main style={{ paddingTop: '5rem', background: 'var(--off-white)', minHeight: '100vh' }}>

        {/* ── Hero banner ── */}
        <div style={{ background: 'var(--ink)', padding: '3rem 4vw 4rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', background: 'var(--red)', opacity: 0.07 }} />
          <div style={{ position: 'absolute', bottom: -60, left: -60, width: 200, height: 200, borderRadius: '50%', border: '40px solid rgba(255,255,255,0.04)' }} />

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1.5rem', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
            <div style={{ position: 'relative' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--serif)', fontSize: '1.8rem', fontWeight: 900, color: 'var(--white)', border: '3px solid rgba(255,255,255,0.15)', flexShrink: 0 }}>
                {initials}
              </div>
              <div style={{ position: 'absolute', bottom: 2, right: 2, width: 16, height: 16, borderRadius: '50%', background: '#22c55e', border: '2px solid var(--ink)' }} />
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
                <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 900, color: 'var(--white)', letterSpacing: '-0.02em' }}>
                  {name || email}
                </h1>
                <span style={{ fontSize: '0.65rem', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.2rem 0.55rem', borderRadius: 1, background: 'rgba(196,30,58,0.25)', color: '#fca5a5', border: '1px solid rgba(196,30,58,0.3)' }}>
                  {user?.role ?? 'CUSTOMER'}
                </span>
              </div>
              <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', fontWeight: 300 }}>{email}</div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexShrink: 0 }}>
              <button
                onClick={() => setEditMode(v => !v)}
                style={{ padding: '0.55rem 1.2rem', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 2, color: 'rgba(255,255,255,0.75)', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'var(--sans)', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.14)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
              >
                {editMode ? 'Cancel' : 'Edit Profile'}
              </button>
              <button
                onClick={handleLogout}
                style={{ padding: '0.55rem 1.2rem', background: 'rgba(196,30,58,0.2)', border: '1px solid rgba(196,30,58,0.4)', borderRadius: 2, color: '#fca5a5', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'var(--sans)', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(196,30,58,0.35)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(196,30,58,0.2)'}
              >
                Sign out
              </button>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '2.5rem', marginTop: '2rem', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
            {[
              { label: 'Total Orders', val: ordersLoading ? '—' : totalOrders },
              { label: 'Total Spent',  val: ordersLoading ? '—' : `$${totalSpent.toFixed(2)}` },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: '1.6rem', fontWeight: 900, color: 'var(--white)', lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.25rem', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 300 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div style={{ background: 'var(--white)', borderBottom: '1px solid var(--border)', padding: '0 4vw', display: 'flex', gap: 0, overflowX: 'auto' }}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{ padding: '1rem 1.5rem', background: 'none', border: 'none', borderBottom: `2px solid ${tab === t.key ? 'var(--red)' : 'transparent'}`, fontSize: '0.82rem', fontWeight: tab === t.key ? 500 : 300, color: tab === t.key ? 'var(--red)' : 'var(--ink-muted)', cursor: 'pointer', fontFamily: 'var(--sans)', display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap', transition: 'color 0.2s', marginBottom: -1 }}
            >
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        <div style={{ padding: '2.5rem 4vw 5rem', maxWidth: 900, margin: '0 auto' }}>

          {/* ── OVERVIEW ── */}
          {tab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

              {/* Edit form */}
              {editMode && (
                <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '1.75rem' }}>
                  <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '1.25rem' }}>Edit Profile</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                    {[{ label: 'Display Name', val: name, set: setName }, { label: 'Phone', val: phone, set: setPhone }].map(f => (
                      <div key={f.label} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <label style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>{f.label}</label>
                        <input value={f.val} onChange={e => f.set(e.target.value)} style={{ padding: '0.65rem 0.8rem', border: '1.5px solid var(--border)', borderRadius: 2, fontSize: '0.88rem', fontFamily: 'var(--sans)', outline: 'none' }} onFocus={e => e.currentTarget.style.borderColor = 'var(--red)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'} />
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={() => setEditMode(false)} style={{ padding: '0.65rem 1.5rem', background: 'var(--red)', color: 'var(--white)', border: 'none', borderRadius: 2, fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--sans)' }}>Save changes</button>
                    <button onClick={() => setEditMode(false)} style={{ padding: '0.65rem 1.2rem', background: 'none', border: '1px solid var(--border)', borderRadius: 2, fontSize: '0.85rem', color: 'var(--ink-muted)', cursor: 'pointer', fontFamily: 'var(--sans)' }}>Cancel</button>
                  </div>
                </div>
              )}

              {/* Account details */}
              <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '1.75rem' }}>
                <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '1.25rem' }}>Account Details</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }} className="profile-grid">
                  {[
                    { label: 'Name',    val: name || '—' },
                    { label: 'Email',   val: email },
                    { label: 'Phone',   val: phone || '—' },
                    { label: 'Role',    val: user?.role ?? '—' },
                  ].map(item => (
                    <div key={item.label}>
                      <div style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '0.25rem' }}>{item.label}</div>
                      <div style={{ fontSize: '0.88rem', color: 'var(--ink)' }}>{item.val}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent orders */}
              <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '1.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink)' }}>Recent Orders</h2>
                  <button onClick={() => setTab('orders')} style={{ fontSize: '0.78rem', color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)', borderBottom: '1px solid var(--red-mid)', paddingBottom: 1 }}>View all →</button>
                </div>
                {ordersLoading ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--ink-faint)', fontSize: '0.85rem' }}>Loading orders…</div>
                ) : orders.length === 0 ? (
                  <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--ink-faint)', fontSize: '0.88rem' }}>
                    No orders yet. <Link href="/products" style={{ color: 'var(--red)' }}>Start shopping</Link>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {orders.slice(0, 3).map((o, i) => {
                      const s = STATUS_STYLE[o.status] ?? STATUS_STYLE.PENDING;
                      return (
                        <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.9rem 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none', gap: '1rem', flexWrap: 'wrap' }}>
                          <div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--ink)', marginBottom: '0.2rem' }}>#{o.orderNumber}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--ink-faint)', fontWeight: 300 }}>
                              {o.items?.[0]?.product?.title}{o.items?.length > 1 ? ` + ${o.items.length - 1} more` : ''} · {new Date(o.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 500, padding: '0.2rem 0.5rem', borderRadius: 1, background: s.bg, color: s.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</span>
                            <span style={{ fontFamily: 'var(--serif)', fontWeight: 700, color: 'var(--red)' }}>${o.totalAmount.toFixed(2)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Quick actions */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }} className="quick-actions">
                {[
                  { icon: '💬', label: 'Support',         href: '/support' },
                  { icon: '📦', label: 'Track Orders',    href: '/orders' },
                  { icon: '🛍', label: 'Shop Products',   href: '/products' },
                ].map(a => (
                  <Link key={a.label} href={a.href} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.25rem', background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, textDecoration: 'none', fontSize: '0.85rem', color: 'var(--ink)', fontWeight: 400, transition: 'border-color 0.2s, color 0.2s' }} onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--red)'; e.currentTarget.style.color = 'var(--red)'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--ink)'; }}>
                    <span style={{ fontSize: '1.2rem' }}>{a.icon}</span> {a.label}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* ── ORDERS ── */}
          {tab === 'orders' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--ink)' }}>All Orders</h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--ink-faint)' }}>{totalOrders} total</span>
              </div>

              {ordersLoading ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--ink-faint)' }}>Loading…</div>
              ) : orders.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--ink-faint)', fontSize: '0.88rem' }}>
                  No orders found. <Link href="/products" style={{ color: 'var(--red)' }}>Start shopping</Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {orders.map(o => {
                    const s = STATUS_STYLE[o.status] ?? STATUS_STYLE.PENDING;
                    return (
                      <div key={o.id} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.2rem' }}>#{o.orderNumber}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--ink-faint)' }}>
                            {o.items?.[0]?.product?.title}{o.items?.length > 1 ? ` + ${o.items.length - 1} more` : ''} · {new Date(o.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <span style={{ fontSize: '0.65rem', fontWeight: 500, padding: '0.22rem 0.55rem', borderRadius: 1, background: s.bg, color: s.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</span>
                          <span style={{ fontFamily: 'var(--serif)', fontWeight: 700, color: 'var(--red)', fontSize: '1.05rem' }}>${o.totalAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── ADDRESSES ── */}
          {tab === 'addresses' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--ink)' }}>Saved Addresses</h2>
                <button style={{ padding: '0.55rem 1.1rem', background: 'var(--red)', color: 'var(--white)', border: 'none', borderRadius: 2, fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--sans)' }}>+ Add address</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {MOCK_ADDRESSES.map(addr => (
                  <div key={addr.id} style={{ background: 'var(--white)', border: `1.5px solid ${addr.default ? 'var(--red-mid)' : 'var(--border)'}`, borderRadius: 4, padding: '1.5rem', position: 'relative' }}>
                    {addr.default && <span style={{ position: 'absolute', top: '1rem', right: '1rem', fontSize: '0.62rem', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '0.18rem 0.5rem', background: 'var(--red-light)', color: 'var(--red)', borderRadius: 1 }}>Default</span>}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span>📍</span>
                      <span style={{ fontFamily: 'var(--serif)', fontWeight: 700, color: 'var(--ink)' }}>{addr.label}</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', lineHeight: 1.65, fontWeight: 300 }}>
                      {addr.line1}{addr.line2 && `, ${addr.line2}`}<br />{addr.city}, {addr.state} {addr.zip}<br />{addr.country}
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                      <button style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)', padding: 0 }} onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-muted)'}>Edit</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── WISHLIST ── */}
          {tab === 'wishlist' && (
            <div>
              <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '1.5rem' }}>Saved Items</h2>
              <div style={{ padding: '4rem', textAlign: 'center', background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4 }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>♡</div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', color: 'var(--ink)', marginBottom: '0.5rem' }}>No saved items yet</div>
                <p style={{ fontSize: '0.85rem', color: 'var(--ink-faint)', marginBottom: '1.5rem' }}>Tap the heart icon on any product to save it here.</p>
                <Link href="/products" style={{ padding: '0.65rem 1.4rem', background: 'var(--red)', color: 'var(--white)', borderRadius: 2, textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500 }}>Browse Products</Link>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />

      <style>{`
        @media (max-width: 640px) {
          .profile-grid { grid-template-columns: 1fr !important; }
          .quick-actions { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}