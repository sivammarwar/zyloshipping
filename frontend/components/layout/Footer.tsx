'use client';

import Link from 'next/link';

const FOOTER_LINKS = {
  Store: [
    { label: 'Browse Products', href: '/products' },
    { label: 'Flash Deals', href: '/deals' },
    { label: 'New Arrivals', href: '/products?sort=newest' },
    { label: 'Track Order', href: '/track' },
    { label: 'My Account', href: '/profile' },
  ],
  Sellers: [
    { label: 'Start Selling', href: '/register' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Supplier Network', href: '/suppliers' },
    { label: 'AI Pricing Tool', href: '/tools/pricing' },
    { label: 'Analytics Dashboard', href: '/dashboard/analytics' },
  ],
  Company: [
    { label: 'About', href: '/about' },
    { label: 'Blog', href: '/blog' },
    { label: 'Careers', href: '/careers' },
    { label: 'Contact', href: '/contact' },
    { label: 'Status', href: '/status' },
  ],
};

export default function Footer() {
  return (
    <footer
      style={{
        background: 'var(--ink)',
        color: 'var(--white)',
        padding: '4rem 4vw 2.5rem',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.6fr 1fr 1fr 1fr',
          gap: '3rem',
          marginBottom: '3rem',
        }}
      >
        {/* Brand col */}
        <div>
          <div
            style={{
              fontFamily: 'var(--serif)',
              fontSize: '1.5rem',
              fontWeight: 900,
              color: 'var(--white)',
              marginBottom: '0.8rem',
              letterSpacing: '-0.02em',
            }}
          >
            Zylo<span style={{ color: 'var(--red)' }}>.</span>
          </div>
          <p
            style={{
              fontSize: '0.82rem',
              color: 'rgba(255,255,255,0.4)',
              fontWeight: 300,
              lineHeight: 1.7,
              marginBottom: '1.5rem',
              maxWidth: 260,
            }}
          >
            The world&apos;s AI-powered dropshipping platform. Source from global suppliers, sell everywhere, get paid any way.
          </p>

          {/* Social links */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {[
              {
                href: '#',
                icon: (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <rect x="2" y="2" width="10" height="10" rx="2.5" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" />
                    <circle cx="7" cy="7" r="2.5" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" />
                    <circle cx="10" cy="4" r="0.8" fill="rgba(255,255,255,0.4)" />
                  </svg>
                ),
              },
              {
                href: '#',
                icon: (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M13 1L8 6.5M13 1H9M13 1V5" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M6 3H3C2 3 1 4 1 5v6c0 1 1 2 2 2h6c1 0 2-1 2-2v-3" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                ),
              },
              {
                href: '#',
                icon: (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M1 1h4.5l2 5-2.5 1.5A9 9 0 0 0 8.5 11L10 8.5l5 2v4.5A1.5 1.5 0 0 1 13.5 13C6 13 1 8 1 1.5A1.5 1.5 0 0 1 2.5 0" stroke="rgba(255,255,255,0.4)" strokeWidth="1.1" strokeLinejoin="round" />
                  </svg>
                ),
              },
            ].map((social, i) => (
              <Link
                key={i}
                href={social.href}
                style={{
                  width: 32,
                  height: 32,
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'border-color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(196,30,58,0.6)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}
              >
                {social.icon}
              </Link>
            ))}
          </div>

          {/* Shipping badges */}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            {['🌍 Global', '🔒 SSL', '📦 Fast'].map((badge) => (
              <span
                key={badge}
                style={{
                  fontSize: '0.68rem',
                  padding: '0.25rem 0.6rem',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 2,
                  color: 'rgba(255,255,255,0.5)',
                  letterSpacing: '0.04em',
                }}
              >
                {badge}
              </span>
            ))}
          </div>
        </div>

        {/* Link columns */}
        {Object.entries(FOOTER_LINKS).map(([title, links]) => (
          <div key={title}>
            <div
              style={{
                fontSize: '0.65rem',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.35)',
                marginBottom: '1rem',
              }}
            >
              {title}
            </div>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    style={{
                      fontSize: '0.83rem',
                      color: 'rgba(255,255,255,0.55)',
                      textDecoration: 'none',
                      fontWeight: 300,
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--red)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Newsletter row */}
      <div
        style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          padding: '2rem 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '2rem',
          flexWrap: 'wrap',
          marginBottom: '2rem',
        }}
      >
        <div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--white)', marginBottom: '0.25rem' }}>
            Get deals in your inbox
          </div>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', fontWeight: 300 }}>
            Weekly curated drops. No spam, ever.
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="email"
            placeholder="your@email.com"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 2,
              padding: '0.6rem 1rem',
              fontSize: '0.82rem',
              color: 'var(--white)',
              outline: 'none',
              width: 220,
            }}
          />
          <button
            style={{
              background: 'var(--red)',
              color: 'var(--white)',
              border: 'none',
              borderRadius: 2,
              padding: '0.6rem 1.2rem',
              fontSize: '0.8rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--red-deep)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--red)')}
          >
            Subscribe
          </button>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.25)', fontWeight: 300 }}>
          © {new Date().getFullYear()} ZyloShipping Technologies · Made with care, shipped everywhere
        </span>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          {[
            { label: 'Privacy Policy', href: '/privacy' },
            { label: 'Terms of Service', href: '/terms' },
            { label: 'Refund Policy', href: '/refunds' },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                fontSize: '0.72rem',
                color: 'rgba(255,255,255,0.3)',
                textDecoration: 'none',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Responsive styles */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media (max-width: 1024px) {
              footer > div:first-child {
                grid-template-columns: 1fr 1fr !important;
              }
            }
            @media (max-width: 640px) {
              footer > div:first-child {
                grid-template-columns: 1fr !important;
                gap: 2rem !important;
              }
            }
          `,
        }}
      />
    </footer>
  );
}