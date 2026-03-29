'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getUserFromToken } from '@/lib/tokenManager';

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const user = getUserFromToken();

  const navItems = [
    { href: '/',         label: 'Home',    icon: '🏠' },
    { href: '/products', label: 'Products', icon: '🛍️' },
    { href: '/cart',     label: 'Cart',    icon: '🛒' },
    { href: '/orders',   label: 'Orders',  icon: '📦', authRequired: true },
    { href: '/support',  label: 'Support', icon: '💬', authRequired: true },
  ];

  const filteredItems = navItems.filter(item => !item.authRequired || user);

  return (
    <>
      {/* Hamburger button — only visible on mobile (≤768px) */}
      <button
        onClick={() => setIsOpen(v => !v)}
        aria-label="Toggle menu"
        className="mobile-nav-toggle"
        style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          zIndex: 500,
          padding: '0.5rem',
          background: 'var(--white)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          cursor: 'pointer',
          display: 'none',           // shown via CSS media query below
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 5,
          width: 40,
          height: 40,
          alignItems: 'center',
        }}
      >
        <span style={{
          display: 'block', width: 20, height: 1.5,
          background: 'var(--ink)', transition: 'all 0.25s',
          transform: isOpen ? 'rotate(45deg) translateY(6.5px)' : 'none',
        }} />
        <span style={{
          display: 'block', width: 20, height: 1.5,
          background: 'var(--ink)', transition: 'opacity 0.25s',
          opacity: isOpen ? 0 : 1,
        }} />
        <span style={{
          display: 'block', width: 20, height: 1.5,
          background: 'var(--ink)', transition: 'all 0.25s',
          transform: isOpen ? 'rotate(-45deg) translateY(-6.5px)' : 'none',
        }} />
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="mobile-nav-toggle"
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.45)',
            zIndex: 498,
            backdropFilter: 'blur(2px)',
            display: 'none',           // shown via CSS
          }}
        />
      )}

      {/* Slide-in drawer */}
      <div
        className="mobile-nav-toggle"
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: 280, maxWidth: '85vw',
          background: 'var(--white)',
          zIndex: 499,
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.28s cubic-bezier(0.22,1,0.36,1)',
          overflowY: 'auto',
          boxShadow: '-4px 0 32px rgba(0,0,0,0.1)',
          display: 'none',             // shown via CSS
        }}
      >
        <div style={{ padding: '5rem 1.5rem 2rem' }}>

          {/* User info */}
          {user && (
            <div style={{
              marginBottom: '1.5rem', paddingBottom: '1.5rem',
              borderBottom: '1px solid var(--border)',
            }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--ink-faint)', marginBottom: '0.25rem' }}>
                Signed in as
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--ink)' }}>
                {user.email}
              </div>
            </div>
          )}

          {/* Nav links */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {filteredItems.map(item => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.75rem 1rem', borderRadius: 6,
                    textDecoration: 'none', transition: 'background 0.15s',
                    background: active ? 'var(--red-light)' : 'transparent',
                    color: active ? 'var(--red)' : 'var(--ink-muted)',
                    fontSize: '0.9rem', fontWeight: active ? 500 : 300,
                    fontFamily: 'var(--sans)',
                  }}
                >
                  <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Auth actions */}
          <div style={{
            marginTop: '1.5rem', paddingTop: '1.5rem',
            borderTop: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column', gap: '0.25rem',
          }}>
            {user ? (
              <>
                {user.role === 'ADMIN' && (
                  <Link
                    href="/dashboard"
                    onClick={() => setIsOpen(false)}
                    style={{
                      display: 'block', padding: '0.75rem 1rem',
                      textDecoration: 'none', color: 'var(--ink-muted)',
                      fontSize: '0.88rem', fontFamily: 'var(--sans)', borderRadius: 6,
                    }}
                  >
                    ⚙️ Admin Dashboard
                  </Link>
                )}
                <button
                  onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
                  style={{
                    padding: '0.75rem 1rem', background: 'none',
                    border: 'none', cursor: 'pointer', textAlign: 'left',
                    color: 'var(--red)', fontSize: '0.88rem',
                    fontFamily: 'var(--sans)', borderRadius: 6,
                  }}
                >
                  🚪 Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  style={{
                    display: 'block', padding: '0.75rem 1rem',
                    textDecoration: 'none', color: 'var(--ink-muted)',
                    fontSize: '0.88rem', fontFamily: 'var(--sans)', borderRadius: 6,
                  }}
                >
                  🔑 Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsOpen(false)}
                  style={{
                    display: 'block', padding: '0.75rem 1rem',
                    background: 'var(--red)', color: 'var(--white)',
                    textDecoration: 'none', borderRadius: 6,
                    fontSize: '0.88rem', fontWeight: 500,
                    fontFamily: 'var(--sans)', textAlign: 'center',
                  }}
                >
                  Create Account
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Only show on mobile — the Header already handles desktop nav */}
      <style>{`
        @media (max-width: 768px) {
          .mobile-nav-toggle { display: flex !important; }
        }
      `}</style>
    </>
  );
}