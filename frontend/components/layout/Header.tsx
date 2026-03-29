'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const NAV_LINKS = [
  { label: 'Products', href: '/products' },
  { label: 'Track Order', href: '/track' },
  { label: 'About', href: '/about' },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
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

      {/* Desktop nav links */}
      <ul
        style={{
          display: 'flex',
          gap: '2rem',
          listStyle: 'none',
          alignItems: 'center',
          margin: 0,
          padding: 0,
        }}
        className="hidden-mobile"
      >
        {NAV_LINKS.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              style={{
                fontSize: '0.85rem',
                fontWeight: 400,
                color: 'var(--ink-muted)',
                textDecoration: 'none',
                letterSpacing: '0.02em',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--red)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--ink-muted)')}
            >
              {link.label}
            </Link>
          </li>
        ))}

        {/* Cart icon */}
        <li>
          <Link
            href="/cart"
            style={{
              display: 'flex',
              alignItems: 'center',
              color: 'var(--ink-muted)',
              textDecoration: 'none',
              transition: 'color 0.2s',
              position: 'relative',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--red)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--ink-muted)')}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 1h2l2.4 10.8A2 2 0 0 0 7.4 13H14a2 2 0 0 0 1.97-1.67L17 6H4" />
              <circle cx="7.5" cy="16" r="1" />
              <circle cx="14.5" cy="16" r="1" />
            </svg>
            {/* Cart badge */}
            <span
              style={{
                position: 'absolute',
                top: -6,
                right: -6,
                background: 'var(--red)',
                color: 'var(--white)',
                width: 14,
                height: 14,
                borderRadius: '50%',
                fontSize: '0.6rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
              }}
            >
              0
            </span>
          </Link>
        </li>

        {/* Profile/Login */}
        <li>
          <Link
            href="/profile"
            style={{
              display: 'flex',
              alignItems: 'center',
              color: 'var(--ink-muted)',
              textDecoration: 'none',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--red)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--ink-muted)')}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="6" r="3.5" />
              <path d="M1.5 16.5c0-4 3.4-7 7.5-7s7.5 3 7.5 7" />
            </svg>
          </Link>
        </li>

        {/* Chat / Support icon */}
        <li>
          <Link
            href="/support"
            aria-label="Support chat"
            style={{
              display: 'flex',
              alignItems: 'center',
              color: 'var(--ink-muted)',
              textDecoration: 'none',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--red)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--ink-muted)')}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 2H2a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h3l3 3 3-3h5a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z" />
              <line x1="5" y1="7" x2="13" y2="7" />
              <line x1="5" y1="10" x2="9" y2="10" />
            </svg>
          </Link>
        </li>

        {/* CTA */}
        <li>
          <Link
            href="/register"
            style={{
              background: 'var(--red)',
              color: 'var(--white)',
              padding: '0.5rem 1.2rem',
              borderRadius: 2,
              fontWeight: 500,
              fontSize: '0.82rem',
              letterSpacing: '0.04em',
              textDecoration: 'none',
              transition: 'background 0.2s, transform 0.15s',
              display: 'inline-block',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--red-deep)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--red)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Start Selling
          </Link>
        </li>
      </ul>

      {/* Hamburger */}
      <button
        onClick={() => setMenuOpen((v) => !v)}
        style={{
          display: 'none',
          flexDirection: 'column',
          gap: 5,
          cursor: 'pointer',
          background: 'none',
          border: 'none',
          padding: 0,
        }}
        className="show-mobile"
        aria-label="Toggle menu"
      >
        <span
          style={{
            display: 'block',
            width: 22,
            height: 1.5,
            background: 'var(--ink)',
            transition: 'all 0.25s',
            transform: menuOpen ? 'rotate(45deg) translateY(6.5px)' : 'none',
          }}
        />
        <span
          style={{
            display: 'block',
            width: 22,
            height: 1.5,
            background: 'var(--ink)',
            transition: 'all 0.25s',
            opacity: menuOpen ? 0 : 1,
          }}
        />
        <span
          style={{
            display: 'block',
            width: 22,
            height: 1.5,
            background: 'var(--ink)',
            transition: 'all 0.25s',
            transform: menuOpen ? 'rotate(-45deg) translateY(-6.5px)' : 'none',
          }}
        />
      </button>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          style={{
            position: 'fixed',
            top: '4rem',
            left: 0,
            right: 0,
            background: 'var(--off-white)',
            borderBottom: '1px solid var(--border)',
            padding: '1.5rem 5vw',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            zIndex: 99,
          }}
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              style={{
                fontSize: '1rem',
                fontWeight: 400,
                color: 'var(--ink-muted)',
                textDecoration: 'none',
                padding: '0.5rem 0',
                borderBottom: '1px solid var(--border)',
              }}
            >
              {link.label}
            </Link>
          ))}

          {/* Support link in mobile menu */}
          <Link
            href="/support"
            onClick={() => setMenuOpen(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              fontSize: '1rem',
              fontWeight: 400,
              color: 'var(--ink-muted)',
              textDecoration: 'none',
              padding: '0.5rem 0',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 2H2a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h3l3 3 3-3h5a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z" />
              <line x1="5" y1="7" x2="13" y2="7" />
              <line x1="5" y1="10" x2="9" y2="10" />
            </svg>
            Support
          </Link>

          <Link
            href="/register"
            onClick={() => setMenuOpen(false)}
            style={{
              background: 'var(--red)',
              color: 'var(--white)',
              padding: '0.75rem 1.5rem',
              borderRadius: 2,
              fontWeight: 500,
              fontSize: '0.88rem',
              textDecoration: 'none',
              textAlign: 'center',
              marginTop: '0.5rem',
            }}
          >
            Start Selling
          </Link>
        </div>
      )}

      {/* Mobile responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
        }
        @media (min-width: 769px) {
          .show-mobile { display: none !important; }
        }
      `}</style>
    </nav>
  );
}