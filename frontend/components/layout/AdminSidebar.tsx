'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

const NAV_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Overview',
    items: [
      {
        label: 'Dashboard',
        href: '/dashboard',
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="1" width="6" height="6" rx="1" />
            <rect x="9" y="1" width="6" height="6" rx="1" />
            <rect x="1" y="9" width="6" height="6" rx="1" />
            <rect x="9" y="9" width="6" height="6" rx="1" />
          </svg>
        ),
      },
      {
        label: 'Analytics',
        href: '/dashboard/analytics',
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1,12 5,7 9,9 15,3" />
            <polyline points="11,3 15,3 15,7" />
          </svg>
        ),
      },
    ],
  },
  {
    title: 'Catalogue',
    items: [
      {
        label: 'Products',
        href: '/dashboard/products',
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 2h2l2.4 7.2A1.5 1.5 0 0 0 7.9 10H12a1.5 1.5 0 0 0 1.5-1.2L14.5 5H4" />
            <circle cx="6.5" cy="13" r="1" />
            <circle cx="11.5" cy="13" r="1" />
          </svg>
        ),
      },
      {
        label: 'Inventory',
        href: '/dashboard/inventory',
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 1L1 4.5V12l7 3.5 7-3.5V4.5L8 1z" />
            <path d="M1 4.5L8 8l7-3.5M8 8v7.5" />
          </svg>
        ),
      },
      {
        label: 'Categories',
        href: '/dashboard/categories',
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 3h4v4H1zM1 9h4v4H1zM7 3h8M7 6h8M7 9h8M7 12h5" />
          </svg>
        ),
      },
    ],
  },
  {
    title: 'Orders',
    items: [
      {
        label: 'All Orders',
        href: '/dashboard/orders',
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="1" width="12" height="14" rx="1.5" />
            <path d="M5 5h6M5 8h6M5 11h4" />
          </svg>
        ),
      },
      {
        label: 'Fulfilment',
        href: '/dashboard/fulfilment',
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 5h14M1 5l2-4h10l2 4M1 5v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V5" />
            <path d="M6 9l2 2 4-4" />
          </svg>
        ),
      },
      {
        label: 'Returns',
        href: '/dashboard/returns',
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-3" />
            <path d="M1 7h6M4 4.5L1 7l3 2.5" />
          </svg>
        ),
      },
    ],
  },
  {
    title: 'Customers',
    items: [
      {
        label: 'Users',
        href: '/dashboard/users',
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="5" r="3" />
            <path d="M1 14c0-3.9 3.1-7 7-7s7 3.1 7 7" />
          </svg>
        ),
      },
      {
        label: 'Reviews',
        href: '/dashboard/reviews',
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 1l1.8 3.6L14 5.3l-3 2.9.7 4.1L8 10.4l-3.7 1.9.7-4.1-3-2.9 4.2-.7z" />
          </svg>
        ),
      },
      {
        label: 'Support Tickets',
        href: '/dashboard/support',
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h3l3 3 3-3h3a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z" />
            <line x1="4.5" y1="6.5" x2="11.5" y2="6.5" />
            <line x1="4.5" y1="9" x2="8" y2="9" />
          </svg>
        ),
      },
    ],
  },
  {
    title: 'Settings',
    items: [
      {
        label: 'Store Settings',
        href: '/dashboard/settings',
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="8" r="2.5" />
            <path d="M8 1v2M8 13v2M1 8h2M13 8h2M2.9 2.9l1.4 1.4M11.7 11.7l1.4 1.4M2.9 13.1l1.4-1.4M11.7 4.3l1.4-1.4" />
          </svg>
        ),
      },
      {
        label: 'Integrations',
        href: '/dashboard/integrations',
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 8h6M10 5l3 3-3 3M6 11l-3-3 3-3" />
          </svg>
        ),
      },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: 220,
        flexShrink: 0,
        background: 'var(--white)',
        borderRight: '1px solid var(--border)',
        minHeight: '100vh',
        position: 'sticky',
        top: 0,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Brand */}
      <div style={{
        padding: '1.5rem 1.25rem 1rem',
        borderBottom: '1px solid var(--border)',
      }}>
        <Link
          href="/"
          style={{
            fontFamily: 'var(--serif)',
            fontSize: '1.3rem',
            fontWeight: 900,
            color: 'var(--ink)',
            textDecoration: 'none',
            letterSpacing: '-0.02em',
          }}
        >
          Zylo<span style={{ color: 'var(--red)' }}>.</span>
        </Link>
        <div style={{
          fontSize: '0.62rem',
          fontWeight: 500,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--ink-faint)',
          marginTop: '0.2rem',
        }}>
          Admin Panel
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '1rem 0.75rem', flex: 1 }}>
        {NAV_SECTIONS.map(section => (
          <div key={section.title} style={{ marginBottom: '1.5rem' }}>
            <div style={{
              fontSize: '0.6rem',
              fontWeight: 500,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--ink-faint)',
              padding: '0 0.5rem',
              marginBottom: '0.4rem',
            }}>
              {section.title}
            </div>

            {section.items.map(item => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.55rem 0.75rem',
                    borderRadius: 4,
                    textDecoration: 'none',
                    fontSize: '0.82rem',
                    fontWeight: active ? 500 : 300,
                    fontFamily: 'var(--sans)',
                    color: active ? 'var(--red)' : 'var(--ink-muted)',
                    background: active ? 'var(--red-light)' : 'transparent',
                    transition: 'background 0.15s, color 0.15s',
                    marginBottom: '0.1rem',
                    position: 'relative',
                  }}
                  onMouseEnter={e => {
                    if (!active) {
                      e.currentTarget.style.background = 'var(--off-white)';
                      e.currentTarget.style.color = 'var(--ink)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--ink-muted)';
                    }
                  }}
                >
                  {/* Active indicator bar */}
                  {active && (
                    <span style={{
                      position: 'absolute',
                      left: 0, top: '20%', bottom: '20%',
                      width: 2.5,
                      background: 'var(--red)',
                      borderRadius: 2,
                    }} />
                  )}
                  <span style={{
                    flexShrink: 0,
                    color: active ? 'var(--red)' : 'var(--ink-faint)',
                    display: 'flex',
                    alignItems: 'center',
                  }}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                  {item.badge && (
                    <span style={{
                      marginLeft: 'auto',
                      background: 'var(--red)',
                      color: 'var(--white)',
                      fontSize: '0.58rem',
                      fontWeight: 600,
                      padding: '0.1rem 0.4rem',
                      borderRadius: 20,
                      minWidth: 18,
                      textAlign: 'center',
                    }}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{
        padding: '1rem 1.25rem',
        borderTop: '1px solid var(--border)',
        fontSize: '0.72rem',
        color: 'var(--ink-faint)',
      }}>
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--ink-faint)',
            textDecoration: 'none',
            transition: 'color 0.15s',
            marginBottom: '0.5rem',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-faint)'}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 2L4 6l4 4" />
          </svg>
          Back to store
        </Link>
        <div>v1.3.1</div>
      </div>
    </aside>
  );
}