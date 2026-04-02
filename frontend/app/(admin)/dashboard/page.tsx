'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface DashboardStats {
  revenueToday: number;
  ordersToday: number;
  avgOrderValue: number;
  deliverySuccessRate: number;
}

interface Order {
  id: string;
  orderNumber: string;
  user: { name: string; email: string };
  totalAmount: number;
  status: string;
  createdAt: string;
  items: any[];
}

interface Agent {
  id: string;
  name: string;
  status: string;
  lastRunAt: string | null;
  totalRuns: number;
  totalTokens: number;
}

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  IN_TRANSIT: { label: 'In Transit', color: '#d97706', bg: '#fef3c7' },
  PROCESSING: { label: 'Processing', color: 'var(--red)', bg: 'var(--red-light)' },
  DELIVERED:  { label: 'Delivered',  color: '#16a34a', bg: '#f0fdf4' },
  SHIPPED:    { label: 'Shipped',    color: '#2563eb', bg: '#eff6ff' },
};

const NAV_ITEMS = [
  { label: 'Dashboard',  href: '/dashboard',            icon: '◈', active: true },
  { label: 'Orders',     href: '/dashboard/orders',     icon: '📦' },
  { label: 'Products',   href: '/dashboard/products',   icon: '🏷' },
  { label: 'Suppliers',  href: '/dashboard/suppliers',  icon: '🔗' },
  { label: 'Analytics',  href: '/dashboard/analytics',  icon: '📊' },
  { label: 'Social Media', href: '/dashboard/social-media/accounts', icon: '📱' },
  { label: 'AI Agents',  href: '/dashboard/agents',     icon: '🤖' },
  { label: 'Settings',   href: '/dashboard/settings',   icon: '⚙️' },
];

// ── Tiny bar chart ────────────────────────────────────────────
function MiniChart({ values }: { values: number[] }) {
  const max = Math.max(...values);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 40 }}>
      {values.map((v, i) => (
        <div key={i} style={{ flex: 1, background: i === values.length - 1 ? 'var(--red)' : 'var(--red-mid)', borderRadius: '2px 2px 0 0', height: `${(v / max) * 100}%`, minHeight: 4, transition: 'height 0.3s' }} />
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  const handleLogout = () => {
    localStorage.removeItem('token');
    document.cookie = 'admin_token=; path=/; max-age=0; SameSite=Lax';
    window.location.href = '/login';
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      window.location.href = '/login';
      return;
    }
    setToken(storedToken);
  }, []);

  useEffect(() => {
    if (!token) return;
    
    async function fetchDashboardData() {
      try {
        const [statsRes, ordersRes, agentsRes] = await Promise.all([
          api.admin.dashboard.stats(token as string).catch(() => null),
          api.admin.orders.list({ limit: 5 }, token as string).catch(() => ({ orders: [] })),
          api.admin.agents.status(token as string).catch(() => ({ agents: [] })),
        ]);
        
        if (statsRes) setStats(statsRes);
        if (ordersRes?.orders) setOrders(ordersRes.orders.slice(0, 5));
        if (agentsRes?.agents) setAgents(agentsRes.agents);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchDashboardData();
  }, [token]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--off-white)', fontFamily: 'var(--sans)' }}>

      {/* ── Sidebar ── */}
      <aside style={{ width: sidebarOpen ? 220 : 64, background: 'var(--ink)', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50, transition: 'width 0.25s cubic-bezier(0.22,1,0.36,1)', overflow: 'hidden' }}>
        {/* Logo */}
        <div style={{ padding: '1.5rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
          <div style={{ width: 32, height: 32, background: 'var(--red)', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontFamily: 'var(--serif)', fontWeight: 900, color: 'white', fontSize: '1rem' }}>Z</span>
          </div>
          {sidebarOpen && <span style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', fontWeight: 900, color: 'white', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>Zylo<span style={{ color: 'var(--red)' }}>.</span></span>}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '1rem 0', overflowY: 'auto' }}>
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.7rem 1.25rem', color: item.active ? 'var(--white)' : 'rgba(255,255,255,0.45)', background: item.active ? 'rgba(196,30,58,0.18)' : 'transparent', borderLeft: `3px solid ${item.active ? 'var(--red)' : 'transparent'}`, textDecoration: 'none', fontSize: '0.84rem', fontWeight: item.active ? 500 : 300, transition: 'all 0.15s', whiteSpace: 'nowrap' }} onMouseEnter={e => { if (!item.active) { e.currentTarget.style.color = 'white'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}} onMouseLeave={e => { if (!item.active) { e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; e.currentTarget.style.background = 'transparent'; }}}>
              <span style={{ fontSize: '1rem', flexShrink: 0 }}>{item.icon}</span>
              {sidebarOpen && item.label}
            </Link>
          ))}
        </nav>

        {/* Collapse toggle */}
        <button onClick={() => setSidebarOpen(v => !v)} style={{ margin: '1rem', padding: '0.6rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2, color: 'rgba(255,255,255,0.45)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s', flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ transform: sidebarOpen ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.25s' }}>
            <path d="M9 2L4 7l5 5" />
          </svg>
        </button>

        {/* Store link */}
        {sidebarOpen && (
          <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
            <Link href="/" style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}>
              ← Back to store
            </Link>
          </div>
        )}
      </aside>

      {/* ── Main ── */}
      <main style={{ marginLeft: sidebarOpen ? 220 : 64, flex: 1, transition: 'margin-left 0.25s cubic-bezier(0.22,1,0.36,1)', minHeight: '100vh' }}>

        {/* Top bar */}
        <div style={{ background: 'var(--white)', borderBottom: '1px solid var(--border)', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 40 }}>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--red)' }}>Admin</div>
            <h1 style={{ fontFamily: 'var(--serif)', fontSize: '1.4rem', fontWeight: 900, color: 'var(--ink)', letterSpacing: '-0.02em' }}>Dashboard</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--ink-faint)' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
            {/* Live indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--red-light)', border: '1px solid var(--red-mid)', borderRadius: 2, padding: '0.3rem 0.7rem' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--red)', animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: '0.65rem', fontWeight: 500, color: 'var(--red)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Live</span>
            </div>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--serif)', fontSize: '0.75rem', fontWeight: 700, color: 'white' }}>RK</div>
            <button onClick={handleLogout} style={{ padding: '0.5rem 1rem', background: 'var(--off-white)', border: '1px solid var(--border)', borderRadius: 2, fontSize: '0.8rem', color: 'var(--ink)', cursor: 'pointer', fontWeight: 500, transition: 'all 0.15s' }} onMouseEnter={e => { e.currentTarget.style.background = 'var(--ink)'; e.currentTarget.style.color = 'white'; }} onMouseLeave={e => { e.currentTarget.style.background = 'var(--off-white)'; e.currentTarget.style.color = 'var(--ink)'; }}>Logout</button>
          </div>
        </div>

        <div style={{ padding: '2rem' }}>

          {/* ── Stat cards ── */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--ink-faint)' }}>Loading dashboard...</div>
          ) : stats ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '1.25rem 1.5rem' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '0.5rem' }}>Revenue today</div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: '1.8rem', fontWeight: 900, color: 'var(--ink)', lineHeight: 1, marginBottom: '0.4rem' }}>${stats?.revenueToday?.toFixed(2) ?? '0.00'}</div>
              </div>
              <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '1.25rem 1.5rem' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '0.5rem' }}>Orders today</div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: '1.8rem', fontWeight: 900, color: 'var(--ink)', lineHeight: 1, marginBottom: '0.4rem' }}>{stats.ordersToday}</div>
              </div>
              <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '1.25rem 1.5rem' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '0.5rem' }}>Avg order value</div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: '1.8rem', fontWeight: 900, color: 'var(--ink)', lineHeight: 1, marginBottom: '0.4rem' }}>${stats?.avgOrderValue?.toFixed(2) ?? '0.00'}</div>
              </div>
              <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '1.25rem 1.5rem' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '0.5rem' }}>Delivery success</div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: '1.8rem', fontWeight: 900, color: 'var(--ink)', lineHeight: 1, marginBottom: '0.4rem' }}>{stats?.deliverySuccessRate?.toFixed(1) ?? '0.0'}%</div>
              </div>
            </div>
          ) : null}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginBottom: '2rem' }}>

            {/* ── Alerts ── */}
            <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '1.5rem' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '1rem' }}>System Alerts</div>
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--ink-faint)', fontSize: '0.82rem' }}>
                No alerts at this time
              </div>
            </div>
          </div>

          {/* ── Recent Orders ── */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>Recent Orders</div>
              <Link href="/dashboard/orders" style={{ fontSize: '0.75rem', color: 'var(--red)', textDecoration: 'none', borderBottom: '1px solid var(--red-mid)', paddingBottom: 1 }}>View all →</Link>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr>
                  {['Order', 'Customer', 'Items', 'Total', 'Status', 'Time'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '0 0.5rem 0.75rem', fontSize: '0.65rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-faint)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--ink-faint)' }}>No recent orders</td></tr>
                ) : orders.map((o) => {
                  const s = STATUS_STYLE[o.status] || { label: o.status, color: '#6b7280', bg: '#f3f4f6' };
                  return (
                    <tr key={o.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.8rem 0.5rem', fontFamily: 'var(--serif)', fontWeight: 700, color: 'var(--ink)', fontSize: '0.85rem' }}>#{o.orderNumber}</td>
                      <td style={{ padding: '0.8rem 0.5rem', color: 'var(--ink-muted)' }}>{o.user?.name || 'Unknown'}</td>
                      <td style={{ padding: '0.8rem 0.5rem', color: 'var(--ink-faint)' }}>{o.items?.length || 0}</td>
                      <td style={{ padding: '0.8rem 0.5rem', fontFamily: 'var(--serif)', fontWeight: 700, color: 'var(--red)' }}>${o.totalAmount?.toFixed(2) ?? '0.00'}</td>
                      <td style={{ padding: '0.8rem 0.5rem' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 500, padding: '0.2rem 0.5rem', borderRadius: 1, background: s.bg, color: s.color, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{s.label}</span>
                      </td>
                      <td style={{ padding: '0.8rem 0.5rem', color: 'var(--ink-faint)', fontSize: '0.75rem' }}>{new Date(o.createdAt).toLocaleTimeString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── AI Agent status ── */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>AI Agents</div>
              <Link href="/dashboard/agents" style={{ fontSize: '0.75rem', color: 'var(--red)', textDecoration: 'none', borderBottom: '1px solid var(--red-mid)', paddingBottom: 1 }}>Manage →</Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
              {agents.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: 'var(--ink-faint)' }}>No AI agents configured</div>
              ) : agents.map((agent) => (
                <div key={agent.id} style={{ border: '1px solid var(--border)', borderRadius: 3, padding: '0.9rem 1rem', background: agent.status === 'RUNNING' ? 'var(--off-white)' : 'var(--white)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: agent.status === 'RUNNING' ? '#22c55e' : 'var(--ink-faint)', boxShadow: agent.status === 'RUNNING' ? '0 0 0 3px rgba(34,197,94,0.15)' : 'none' }} />
                    <div style={{ fontSize: '0.65rem', color: 'var(--ink-faint)' }}>{agent.lastRunAt ? new Date(agent.lastRunAt).toLocaleTimeString() : 'Never'}</div>
                  </div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--ink)', lineHeight: 1.3, marginBottom: '0.35rem' }}>{agent.name}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--ink-faint)' }}>{agent.totalRuns} runs · {Math.round(agent.totalTokens / 1000)}k tokens</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <style jsx>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @media (max-width: 768px) {
          main { margin-left: 64px !important; }
        }
      `}</style>
    </div>
  );
}