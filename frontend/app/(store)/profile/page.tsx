'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

// ── Mock user data ────────────────────────────────────────────
const USER = {
  name: 'Ryan Khanna',
  email: 'ryan@example.com',
  phone: '+1 (555) 012-3456',
  joined: 'January 2026',
  avatar: 'RK',
  tier: 'Gold Seller',
  totalOrders: 47,
  totalSpent: 3842.50,
  savedItems: 12,
};

const RECENT_ORDERS = [
  { id: 'ZY-28431', date: 'March 24, 2026', status: 'IN_TRANSIT', total: 199, item: 'Smart Wireless Crossbody + 1 more' },
  { id: 'ZY-27890', date: 'March 10, 2026', status: 'DELIVERED',  total: 69,  item: 'Breathable Sports Watch' },
  { id: 'ZY-26112', date: 'Feb 28, 2026',   status: 'DELIVERED',  total: 32,  item: 'Foldable Travel Yoga Mat' },
];

const ADDRESSES = [
  { id: '1', label: 'Home', line1: '123 Oak Street', line2: 'Apt 4B', city: 'New York', state: 'NY', zip: '10001', country: 'United States', default: true },
  { id: '2', label: 'Work', line1: '500 5th Avenue', line2: 'Floor 12', city: 'New York', state: 'NY', zip: '10110', country: 'United States', default: false },
];

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  IN_TRANSIT: { label: 'In Transit', color: '#d97706', bg: '#fef3c7' },
  DELIVERED:  { label: 'Delivered',  color: '#16a34a', bg: '#f0fdf4' },
  PROCESSING: { label: 'Processing', color: 'var(--red)', bg: 'var(--red-light)' },
  CANCELLED:  { label: 'Cancelled',  color: '#6b7280', bg: '#f3f4f6' },
};

type Tab = 'overview' | 'orders' | 'addresses' | 'wishlist';

export default function ProfilePage() {
  const [tab, setTab] = useState<Tab>('overview');
  const [editMode, setEditMode] = useState(false);
  const [name, setName]   = useState(USER.name);
  const [phone, setPhone] = useState(USER.phone);

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: 'overview',   label: 'Overview',   icon: '◈' },
    { key: 'orders',     label: 'Orders',     icon: '📦' },
    { key: 'addresses',  label: 'Addresses',  icon: '📍' },
    { key: 'wishlist',   label: 'Wishlist',   icon: '♡' },
  ];

  return (
    <>
      <Header />

      <main style={{ paddingTop: '5rem', background: 'var(--off-white)', minHeight: '100vh' }}>

        {/* ── Profile hero banner ── */}
        <div style={{ background: 'var(--ink)', padding: '3rem 4vw 4rem', position: 'relative', overflow: 'hidden' }}>
          {/* decorative circle */}
          <div style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', background: 'var(--red)', opacity: 0.07 }} />
          <div style={{ position: 'absolute', bottom: -60, left: -60, width: 200, height: 200, borderRadius: '50%', border: '40px solid rgba(255,255,255,0.04)' }} />

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1.5rem', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
            {/* Avatar */}
            <div style={{ position: 'relative' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--serif)', fontSize: '1.8rem', fontWeight: 900, color: 'var(--white)', border: '3px solid rgba(255,255,255,0.15)', flexShrink: 0 }}>
                {USER.avatar}
              </div>
              <div style={{ position: 'absolute', bottom: 2, right: 2, width: 16, height: 16, borderRadius: '50%', background: '#22c55e', border: '2px solid var(--ink)' }} />
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
                <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 900, color: 'var(--white)', letterSpacing: '-0.02em' }}>
                  {USER.name}
                </h1>
                <span style={{ fontSize: '0.65rem', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.2rem 0.55rem', borderRadius: 1, background: 'rgba(196,30,58,0.25)', color: '#fca5a5', border: '1px solid rgba(196,30,58,0.3)' }}>
                  {USER.tier}
                </span>
              </div>
              <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', fontWeight: 300 }}>
                {USER.email} · Member since {USER.joined}
              </div>
            </div>

            <button
              onClick={() => setEditMode((v) => !v)}
              style={{ padding: '0.55rem 1.2rem', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 2, color: 'rgba(255,255,255,0.75)', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'var(--sans)', transition: 'background 0.2s', flexShrink: 0 }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.14)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
            >
              {editMode ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: '2.5rem', marginTop: '2rem', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
            {[
              { label: 'Total Orders', val: USER.totalOrders },
              { label: 'Total Spent', val: `$${USER.totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
              { label: 'Saved Items', val: USER.savedItems },
            ].map((s) => (
              <div key={s.label}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: '1.6rem', fontWeight: 900, color: 'var(--white)', lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.25rem', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 300 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div style={{ background: 'var(--white)', borderBottom: '1px solid var(--border)', padding: '0 4vw', display: 'flex', gap: 0, overflowX: 'auto' }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: '1rem 1.5rem',
                background: 'none',
                border: 'none',
                borderBottom: `2px solid ${tab === t.key ? 'var(--red)' : 'transparent'}`,
                fontSize: '0.82rem',
                fontWeight: tab === t.key ? 500 : 300,
                color: tab === t.key ? 'var(--red)' : 'var(--ink-muted)',
                cursor: 'pointer',
                fontFamily: 'var(--sans)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                whiteSpace: 'nowrap',
                transition: 'color 0.2s',
                marginBottom: -1,
              }}
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
                    {[
                      { label: 'Full Name', val: name, set: setName },
                      { label: 'Phone',     val: phone, set: setPhone },
                    ].map((f) => (
                      <div key={f.label} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <label style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>{f.label}</label>
                        <input value={f.val} onChange={e => f.set(e.target.value)} style={{ padding: '0.65rem 0.8rem', border: '1.5px solid var(--border)', borderRadius: 2, fontSize: '0.88rem', fontFamily: 'var(--sans)', outline: 'none' }} onFocus={e => e.currentTarget.style.borderColor = 'var(--red)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'} />
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={() => setEditMode(false)} style={{ padding: '0.65rem 1.5rem', background: 'var(--red)', color: 'var(--white)', border: 'none', borderRadius: 2, fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--sans)', transition: 'background 0.2s' }}>Save changes</button>
                    <button onClick={() => setEditMode(false)} style={{ padding: '0.65rem 1.2rem', background: 'none', border: '1px solid var(--border)', borderRadius: 2, fontSize: '0.85rem', color: 'var(--ink-muted)', cursor: 'pointer', fontFamily: 'var(--sans)' }}>Cancel</button>
                  </div>
                </div>
              )}

              {/* Info card */}
              <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '1.75rem' }}>
                <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '1.25rem' }}>Account Details</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  {[
                    { label: 'Full Name', val: name },
                    { label: 'Email',     val: USER.email },
                    { label: 'Phone',     val: phone },
                    { label: 'Member Since', val: USER.joined },
                    { label: 'Seller Tier',  val: USER.tier },
                    { label: 'Saved Items',  val: `${USER.savedItems} products` },
                  ].map((item) => (
                    <div key={item.label}>
                      <div style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '0.25rem' }}>{item.label}</div>
                      <div style={{ fontSize: '0.88rem', color: 'var(--ink)', fontWeight: 400 }}>{item.val}</div>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                  {RECENT_ORDERS.map((o, i) => {
                    const s = STATUS_STYLE[o.status];
                    return (
                      <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.9rem 0', borderBottom: i < RECENT_ORDERS.length - 1 ? '1px solid var(--border)' : 'none', gap: '1rem', flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--ink)', marginBottom: '0.2rem' }}>#{o.id}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--ink-faint)', fontWeight: 300 }}>{o.item} · {o.date}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <span style={{ fontSize: '0.65rem', fontWeight: 500, padding: '0.2rem 0.5rem', borderRadius: 1, background: s.bg, color: s.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</span>
                          <span style={{ fontFamily: 'var(--serif)', fontWeight: 700, color: 'var(--red)' }}>${o.total}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick actions */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                {[
                  { icon: '🔒', label: 'Change Password', href: '/settings' },
                  { icon: '🔔', label: 'Notifications',   href: '/settings#notifications' },
                  { icon: '💳', label: 'Payment Methods', href: '/settings#payment' },
                ].map((a) => (
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
                <Link href="/orders" style={{ fontSize: '0.8rem', color: 'var(--red)', textDecoration: 'none', borderBottom: '1px solid var(--red-mid)', paddingBottom: 1 }}>Full order history →</Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {RECENT_ORDERS.map((o) => {
                  const s = STATUS_STYLE[o.status];
                  return (
                    <div key={o.id} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.2rem' }}>#{o.id}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--ink-faint)' }}>{o.item} · {o.date}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 500, padding: '0.22rem 0.55rem', borderRadius: 1, background: s.bg, color: s.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</span>
                        <span style={{ fontFamily: 'var(--serif)', fontWeight: 700, color: 'var(--red)', fontSize: '1.1rem' }}>${o.total}</span>
                        <Link href={`/orders`} style={{ padding: '0.45rem 0.85rem', background: 'none', border: '1px solid var(--border)', borderRadius: 2, fontSize: '0.75rem', color: 'var(--ink-muted)', textDecoration: 'none', fontFamily: 'var(--sans)', transition: 'border-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--red)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>Details</Link>
                      </div>
                    </div>
                  );
                })}
              </div>
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
                {ADDRESSES.map((addr) => (
                  <div key={addr.id} style={{ background: 'var(--white)', border: `1.5px solid ${addr.default ? 'var(--red-mid)' : 'var(--border)'}`, borderRadius: 4, padding: '1.5rem', position: 'relative' }}>
                    {addr.default && (
                      <span style={{ position: 'absolute', top: '1rem', right: '1rem', fontSize: '0.62rem', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '0.18rem 0.5rem', background: 'var(--red-light)', color: 'var(--red)', borderRadius: 1 }}>Default</span>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '1rem' }}>📍</span>
                      <span style={{ fontFamily: 'var(--serif)', fontWeight: 700, color: 'var(--ink)' }}>{addr.label}</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', lineHeight: 1.65, fontWeight: 300 }}>
                      {addr.line1}{addr.line2 && `, ${addr.line2}`}<br />
                      {addr.city}, {addr.state} {addr.zip}<br />
                      {addr.country}
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                      <button style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)', padding: 0, transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-muted)'}>Edit</button>
                      {!addr.default && <button style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)', padding: 0, transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-muted)'}>Set as default</button>}
                      {!addr.default && <button style={{ fontSize: '0.75rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)', padding: 0 }}>Remove</button>}
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                {[
                  { id: '7', name: 'Noise Cancelling Earbuds Pro', price: 79, originalPrice: 149, category: 'Electronics' },
                  { id: '12', name: 'Adjustable Dumbbell 20kg', price: 119, originalPrice: 199, category: 'Fitness' },
                  { id: '6', name: 'Ceramic Pour-Over Coffee Kit', price: 44, originalPrice: 80, category: 'Home Decor' },
                ].map((item) => (
                  <div key={item.id} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, overflow: 'hidden', display: 'flex', gap: '1rem', padding: '1rem', alignItems: 'center' }}>
                    <div style={{ width: 60, height: 60, background: 'var(--red-light)', borderRadius: 3, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg viewBox="0 0 40 40" fill="none" width="32" height="32"><rect x="5" y="10" width="30" height="22" rx="2" fill="none" stroke="#C41E3A" strokeWidth="1.2"/><path d="M13 10V8a7 7 0 0 1 14 0v2" stroke="#C41E3A" strokeWidth="1.2" strokeLinecap="round"/></svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.65rem', color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.2rem' }}>{item.category}</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--ink)', marginBottom: '0.35rem', lineHeight: 1.3 }}>{item.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontFamily: 'var(--serif)', fontWeight: 700, color: 'var(--red)' }}>${item.price}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--ink-faint)', textDecoration: 'line-through' }}>${item.originalPrice}</span>
                      </div>
                    </div>
                    <button style={{ width: 28, height: 28, background: 'var(--red)', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" width="12" height="12"><path d="M7 2v10M2 7h10"/></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />

      <style>{`
        @media (max-width: 640px) {
          div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
          div[style*="grid-template-columns: repeat(3, 1fr)"] { grid-template-columns: 1fr !important; }
          div[style*="grid-template-columns: repeat(2, 1fr)"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}