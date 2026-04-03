'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const NAV_LINKS = [
  { label: 'Products',    href: '/products' },
  { label: 'Track Order', href: '/track'    },
  { label: 'About',       href: '/about'    },
];

/** Reads cart item count from the API (or falls back to 0). */
function useCartCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchCount() {
      try {
        const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
        if (!token) return;

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/cart`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!res.ok) return;

        const data = await res.json();
        const items: Array<{ quantity: number }> =
          data?.items ?? data?.cart?.items ?? [];
        const total = items.reduce((s, i) => s + (i.quantity ?? 1), 0);

        if (!cancelled) setCount(total);
      } catch {
        // ignore — badge just stays 0
      }
    }

    fetchCount();
    const handler = () => fetchCount();
    window.addEventListener('cart-updated', handler);
    return () => {
      cancelled = true;
      window.removeEventListener('cart-updated', handler);
    };
  }, []);

  return count;
}

/** Hook to get current user from token */
function useAuth() {
  const [user, setUser] = useState<{ email: string; role: string } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({ email: payload.email, role: payload.role });
      } catch {
        setUser(null);
      }
    }

    // Listen for auth changes
    const handler = () => {
      const t = localStorage.getItem('token') || localStorage.getItem('auth_token');
      if (t) {
        try {
          const p = JSON.parse(atob(t.split('.')[1]));
          setUser({ email: p.email, role: p.role });
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };
    window.addEventListener('auth-changed', handler);
    return () => window.removeEventListener('auth-changed', handler);
  }, []);

  return { user, mounted };
}

export default function Header() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const cartCount = useCartCount();
  const { user, mounted } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    document.cookie = 'auth_token=; path=/; max-age=0';
    document.cookie = 'admin_token=; path=/; max-age=0';
    window.dispatchEvent(new Event('auth-changed'));
    router.push('/login');
  };

  // Don't render auth UI until mounted (prevent hydration mismatch)
  if (!mounted) {
    return (
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 4vw', background: 'rgba(250, 250, 248, 0.88)', backdropFilter: 'blur(12px)' }}>
        <Link href="/" style={{ fontFamily: 'var(--serif)', fontSize: '1.4rem', fontWeight: 900, color: 'var(--ink)', textDecoration: 'none' }}>
          Zylo<span style={{ color: 'var(--red)' }}>.</span>
        </Link>
      </nav>
    );
  }

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1.25rem 4vw',
        background: 'rgba(250, 250, 248, 0.88)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
        transition: 'border-color 0.3s',
      }}
    >
      {/* Logo */}
      <Link
        href="/"
        style={{
          fontFamily: 'var(--serif)',
          fontSize: '1.4rem',
          fontWeight: 900,
          color: 'var(--ink)',
          textDecoration: 'none',
          letterSpacing: '-0.02em',
        }}
      >
        Zylo<span style={{ color: 'var(--red)' }}>.</span>
      </Link>

      {/* Desktop nav */}
      <ul
        style={{ display: 'flex', gap: '2rem', listStyle: 'none', alignItems: 'center', margin: 0, padding: 0 }}
        className="hidden-mobile"
      >
        {NAV_LINKS.map(link => (
          <li key={link.href}>
            <Link
              href={link.href}
              style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--ink-muted)', textDecoration: 'none', letterSpacing: '0.02em', transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-muted)'}
            >
              {link.label}
            </Link>
          </li>
        ))}

        {/* Cart */}
        <li>
          <Link
            href="/cart"
            style={{ display: 'flex', alignItems: 'center', color: 'var(--ink-muted)', textDecoration: 'none', transition: 'color 0.2s', position: 'relative' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-muted)'}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 1h2l2.4 10.8A2 2 0 0 0 7.4 13H14a2 2 0 0 0 1.97-1.67L17 6H4" />
              <circle cx="7.5" cy="16" r="1" />
              <circle cx="14.5" cy="16" r="1" />
            </svg>
            {cartCount > 0 && (
              <span style={{
                position: 'absolute', top: -6, right: -6,
                background: 'var(--red)', color: 'var(--white)',
                width: 16, height: 16, borderRadius: '50%',
                fontSize: '0.58rem', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontWeight: 600,
              }}>
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </Link>
        </li>

        {user ? (
          // Logged in: Show Profile, Support, Logout
          <>
            <li>
              <Link
                href="/profile"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--ink-muted)', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-muted)'}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="6" r="3.5" />
                  <path d="M1.5 16.5c0-4 3.4-7 7.5-7s7.5 3 7.5 7" />
                </svg>
                <span style={{ fontSize: '0.8rem', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.email.split('@')[0]}
                </span>
              </Link>
            </li>
            <li>
              <button
                onClick={handleLogout}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--ink-muted)',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  padding: '0.4rem 0.8rem',
                  borderRadius: 4,
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-muted)'}
              >
                Logout
              </button>
            </li>
          </>
        ) : (
          // Not logged in: Show Login, Register
          <>
            <li>
              <Link
                href="/login"
                style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--ink-muted)', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-muted)'}
              >
                Login
              </Link>
            </li>
            <li>
              <Link
                href="/register"
                style={{
                  background: 'var(--red)', color: 'var(--white)',
                  padding: '0.5rem 1rem', borderRadius: 2,
                  fontWeight: 500, fontSize: '0.8rem',
                  textDecoration: 'none',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--red-deep)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--red)'}
              >
                Register
              </Link>
            </li>
          </>
        )}
      </ul>

      {/* Hamburger (mobile) */}
      <button
        onClick={() => setMenuOpen(v => !v)}
        style={{ display: 'none', flexDirection: 'column', gap: 5, cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
        className="show-mobile"
        aria-label="Toggle menu"
      >
        {[
          menuOpen ? 'rotate(45deg) translateY(6.5px)' : 'none',
          undefined,
          menuOpen ? 'rotate(-45deg) translateY(-6.5px)' : 'none',
        ].map((transform, i) => (
          <span key={i} style={{
            display: 'block', width: 22, height: 1.5,
            background: 'var(--ink)', transition: 'all 0.25s',
            transform: transform ?? 'none',
            opacity: i === 1 && menuOpen ? 0 : 1,
          }} />
        ))}
      </button>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div style={{
          position: 'fixed', top: '4rem', left: 0, right: 0,
          background: 'var(--off-white)', borderBottom: '1px solid var(--border)',
          padding: '1.5rem 5vw', display: 'flex', flexDirection: 'column',
          gap: '1rem', zIndex: 99,
        }}>
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              style={{
                fontSize: '1rem', fontWeight: 400, color: 'var(--ink-muted)',
                textDecoration: 'none', padding: '0.5rem 0',
                borderBottom: '1px solid var(--border)',
              }}
            >
              {link.label}
            </Link>
          ))}

          <Link
            href="/cart"
            onClick={() => setMenuOpen(false)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.6rem',
              fontSize: '1rem', fontWeight: 400, color: 'var(--ink-muted)',
              textDecoration: 'none', padding: '0.5rem 0',
              borderBottom: '1px solid var(--border)',
            }}
          >
            🛒 Cart{cartCount > 0 && ` (${cartCount})`}
          </Link>

          {user ? (
            <>
              <div style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--ink-faint)' }}>Signed in as</span>
                <div style={{ fontSize: '0.9rem', color: 'var(--ink)', fontWeight: 500 }}>{user.email}</div>
              </div>
              <Link
                href="/profile"
                onClick={() => setMenuOpen(false)}
                style={{
                  fontSize: '1rem', fontWeight: 400, color: 'var(--ink-muted)',
                  textDecoration: 'none', padding: '0.5rem 0',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                👤 Profile
              </Link>
              <Link
                href="/dashboard"
                onClick={() => setMenuOpen(false)}
                style={{
                  fontSize: '1rem', fontWeight: 400, color: 'var(--ink-muted)',
                  textDecoration: 'none', padding: '0.5rem 0',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                🏪 Seller Dashboard
              </Link>
              <button
                onClick={() => { handleLogout(); setMenuOpen(false); }}
                style={{
                  padding: '0.75rem 1rem', background: 'var(--red)', color: 'var(--white)',
                  border: 'none', borderRadius: 2, cursor: 'pointer',
                  fontSize: '0.9rem', fontWeight: 500, marginTop: '0.5rem',
                }}
              >
                🚪 Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                style={{
                  fontSize: '1rem', fontWeight: 400, color: 'var(--ink-muted)',
                  textDecoration: 'none', padding: '0.5rem 0',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                � Login
              </Link>
              <Link
                href="/register"
                onClick={() => setMenuOpen(false)}
                style={{
                  background: 'var(--red)', color: 'var(--white)',
                  padding: '0.75rem 1.5rem', borderRadius: 2,
                  fontWeight: 500, fontSize: '0.88rem',
                  textDecoration: 'none', textAlign: 'center', marginTop: '0.5rem',
                }}
              >
                Create Account
              </Link>
            </>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .show-mobile   { display: flex !important; }
        }
        @media (min-width: 769px) {
          .show-mobile { display: none !important; }
        }
      `}</style>
    </nav>
  );
}