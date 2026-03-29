'use client';

import { useState } from 'react';
import Link from 'next/link';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard',           icon: '◈' },
  { label: 'Orders',    href: '/dashboard/orders',    icon: '📦' },
  { label: 'Products',  href: '/dashboard/products',  icon: '🏷' },
  { label: 'Suppliers', href: '/dashboard/suppliers', icon: '🔗', active: true },
  { label: 'Analytics', href: '/dashboard/analytics', icon: '📊' },
  { label: 'AI Agents', href: '/dashboard/agents',    icon: '🤖' },
  { label: 'Settings',  href: '/dashboard/settings',  icon: '⚙️' },
];

export default function AdminSuppliersPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
        <div style={{ background: 'var(--white)', borderBottom: '1px solid var(--border)', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 40 }}>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--red)' }}>Admin</div>
            <h1 style={{ fontFamily: 'var(--serif)', fontSize: '1.4rem', fontWeight: 900, color: 'var(--ink)', letterSpacing: '-0.02em' }}>Suppliers</h1>
          </div>
        </div>

        {/* Empty State */}
        <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <div style={{ maxWidth: 500, margin: '0 auto' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔗</div>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.8rem', fontWeight: 900, color: 'var(--ink)', marginBottom: '0.75rem' }}>Supplier Management Coming Soon</h2>
            <p style={{ fontSize: '0.95rem', color: 'var(--ink-faint)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              Connect and manage suppliers like AliExpress, CJ Dropshipping, Spocket, and more. Track inventory, sync products, and monitor order fulfillment.
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--ink-faint)', background: 'var(--off-white)', padding: '1rem', borderRadius: 4, border: '1px solid var(--border)' }}>
              <strong>Backend Ready:</strong> The supplier integration system is built. Check the database seed for AliExpress and CJ Dropshipping supplier entries.
            </p>
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
