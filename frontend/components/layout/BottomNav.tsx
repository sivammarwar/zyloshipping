'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getUserFromToken } from '@/lib/tokenManager';

export function BottomNav() {
  const pathname = usePathname();
  const user = getUserFromToken();

  const navItems = [
    { href: '/',                             label: 'Home',   icon: '🏠' },
    { href: '/products',                     label: 'Shop',   icon: '🛍️' },
    { href: '/cart',                         label: 'Cart',   icon: '🛒' },
    { href: user ? '/orders' : '/login',     label: user ? 'Orders' : 'Login', icon: user ? '📦' : '🔑' },
  ];

  return (
    <>
      <div
        className="bottom-nav"
        style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          background: 'var(--white)',
          borderTop: '1px solid var(--border)',
          zIndex: 30,
          display: 'none',           // shown via media query below
          justifyContent: 'space-around',
          alignItems: 'center',
          height: 64,
          // Safe area for iOS home indicator
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {navItems.map(item => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                flex: 1, height: '100%',
                textDecoration: 'none',
                color: isActive ? 'var(--red)' : 'var(--ink-muted)',
                transition: 'color 0.15s',
                gap: '0.15rem',
              }}
            >
              <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>{item.icon}</span>
              <span style={{
                fontSize: '0.62rem', fontWeight: isActive ? 500 : 300,
                fontFamily: 'var(--sans)', letterSpacing: '0.02em',
              }}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .bottom-nav { display: flex !important; }
        }
      `}</style>
    </>
  );
}