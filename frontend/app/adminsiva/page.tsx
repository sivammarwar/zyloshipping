'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const FOUNDER_EMAIL = 'shivamkumarsingh8544@gmail.com';

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  totalStores: number;
  todayRevenue: number;
  todayOrders: number;
}

const SIDEBAR_ITEMS = [
  { id: 'overview', label: 'Overview', icon: '📊', href: '/adminsiva' },
  { id: 'stores', label: 'Stores', icon: '🏪', href: '/adminsiva/stores' },
  { id: 'orders', label: 'Orders', icon: '📦', href: '/adminsiva/orders' },
  { id: 'products', label: 'Products', icon: '🏷', href: '/adminsiva/products' },
  { id: 'suppliers', label: 'Suppliers', icon: '🔗', href: '/adminsiva/suppliers' },
  { id: 'users', label: 'Users', icon: '👥', href: '/adminsiva/users' },
  { id: 'analytics', label: 'Analytics', icon: '📈', href: '/adminsiva/analytics' },
  { id: 'social', label: 'Social Media', icon: '📱', href: '/adminsiva/social/accounts' },
  { id: 'agents', label: 'AI Agents', icon: '🤖', href: '/adminsiva/agents' },
  { id: 'settings', label: 'Settings', icon: '⚙️', href: '/adminsiva/settings' },
];

export default function FounderAdminPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const founderToken = localStorage.getItem('founder_token');
    const founderEmail = localStorage.getItem('founder_email');
    
    if (!founderToken || founderEmail !== FOUNDER_EMAIL) {
      window.location.href = '/adminsiva/login';
      return;
    }

    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/founder/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('founder_token');
    localStorage.removeItem('founder_email');
    window.location.href = '/adminsiva/login';
  }

  const Card = ({ title, value, subtitle, icon, color = 'white' }: any) => (
    <div style={{ 
      background: color, 
      border: '1px solid #e2e8f0', 
      borderRadius: 8, 
      padding: '1.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem'
    }}>
      <div style={{ fontSize: '2.5rem' }}>{icon}</div>
      <div>
        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', marginBottom: '0.25rem' }}>
          {title}
        </div>
        <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#0f172a' }}>
          {value}
        </div>
        {subtitle && (
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', fontFamily: 'var(--sans)' }}>
      {/* Sidebar */}
      <aside style={{ 
        width: sidebarOpen ? 260 : 70, 
        background: '#0f172a', 
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 100,
        transition: 'width 0.3s',
        overflow: 'hidden'
      }}>
        {/* Logo */}
        <div style={{ 
          padding: '1.5rem', 
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <div style={{ 
            width: 36, 
            height: 36, 
            background: '#dc2626', 
            borderRadius: 6, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <span style={{ fontFamily: 'var(--serif)', fontWeight: 900, color: 'white', fontSize: '1.2rem' }}>Z</span>
          </div>
          {sidebarOpen && (
            <span style={{ fontFamily: 'var(--serif)', fontSize: '1.3rem', fontWeight: 900, color: 'white' }}>
              Zylo<span style={{ color: '#dc2626' }}>.</span>
            </span>
          )}
        </div>

        {/* Toggle */}
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            position: 'absolute',
            right: sidebarOpen ? 10 : '50%',
            top: 80,
            transform: sidebarOpen ? 'none' : 'translateX(50%)',
            width: 24,
            height: 24,
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: 4,
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.8rem'
          }}
        >
          {sidebarOpen ? '←' : '→'}
        </button>

        {/* Nav Items */}
        <nav style={{ padding: '1rem 0.75rem', marginTop: '1rem' }}>
          {SIDEBAR_ITEMS.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.875rem 1rem',
                margin: '0.25rem 0',
                borderRadius: 6,
                color: item.id === 'overview' ? 'white' : 'rgba(255,255,255,0.6)',
                background: item.id === 'overview' ? 'rgba(220,38,38,0.2)' : 'transparent',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: 500
              }}
            >
              <span style={{ fontSize: '1.2rem', width: 24, textAlign: 'center' }}>{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ 
          position: 'absolute', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          padding: '1rem',
          borderTop: '1px solid rgba(255,255,255,0.1)'
        }}>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              width: '100%',
              padding: '0.75rem',
              background: 'rgba(255,255,255,0.05)',
              border: 'none',
              borderRadius: 6,
              color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            <span>🚪</span>
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ 
        marginLeft: sidebarOpen ? 260 : 70, 
        flex: 1,
        transition: 'margin-left 0.3s'
      }}>
        {/* Header */}
        <header style={{ 
          background: 'white', 
          padding: '1rem 2rem',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Founder Dashboard
            </h1>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0' }}>
              Platform Overview & Management
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {message && (
              <span style={{ 
                padding: '0.5rem 1rem', 
                background: message.startsWith('✓') ? '#dcfce7' : '#fee2e2',
                color: message.startsWith('✓') ? '#166534' : '#991b1b',
                borderRadius: 4,
                fontSize: '0.85rem'
              }}>
                {message}
              </span>
            )}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>👑 Founder</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{FOUNDER_EMAIL}</div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div style={{ padding: '2rem' }}>
          {/* Stats */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)', 
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            <Card 
              title="Total Revenue" 
              value={`₹${stats?.totalRevenue?.toLocaleString() ?? '0'}`}
              subtitle={`+₹${stats?.todayRevenue?.toLocaleString() ?? '0'} today`}
              icon="💰"
              color="#fef3c7"
            />
            <Card 
              title="Total Orders" 
              value={stats?.totalOrders?.toLocaleString() ?? '0'}
              subtitle={`+${stats?.todayOrders ?? '0'} today`}
              icon="📦"
              color="#dbeafe"
            />
            <Card 
              title="Active Users" 
              value={stats?.totalUsers?.toLocaleString() ?? '0'}
              subtitle="Registered accounts"
              icon="👥"
              color="#dcfce7"
            />
            <Card 
              title="Stores" 
              value={stats?.totalStores?.toLocaleString() ?? '0'}
              subtitle="Active shops"
              icon="🏪"
              color="#fce7f3"
            />
          </div>

          {/* Quick Actions */}
          <div style={{ 
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            padding: '1.5rem',
            marginBottom: '2rem'
          }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: '#0f172a' }}>
              ⚡ Quick Actions
            </h2>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Link href="/adminsiva/stores" style={{
                padding: '0.75rem 1.5rem',
                background: '#dc2626',
                color: 'white',
                borderRadius: 6,
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: 500
              }}>
                🏪 Manage Stores
              </Link>
              <Link href="/adminsiva/orders" style={{
                padding: '0.75rem 1.5rem',
                background: '#f1f5f9',
                color: '#0f172a',
                borderRadius: 6,
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: 500
              }}>
                📦 View Orders
              </Link>
              <Link href="/adminsiva/social/accounts" style={{
                padding: '0.75rem 1.5rem',
                background: '#f1f5f9',
                color: '#0f172a',
                borderRadius: 6,
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: 500
              }}>
                📱 Social Media
              </Link>
              <Link href="/adminsiva/agents" style={{
                padding: '0.75rem 1.5rem',
                background: '#f1f5f9',
                color: '#0f172a',
                borderRadius: 6,
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: 500
              }}>
                🤖 AI Agents
              </Link>
            </div>
          </div>

          {/* Two Column */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
            <div style={{
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              padding: '1.5rem'
            }}>
              <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: '#0f172a' }}>
                📊 Platform Overview
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: 6 }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Products</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>0</div>
                </div>
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: 6 }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Suppliers</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>2</div>
                </div>
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: 6 }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Social Accounts</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>0</div>
                </div>
                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: 6 }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>AI Agents</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>8</div>
                </div>
              </div>
            </div>

            <div style={{
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              padding: '1.5rem'
            }}>
              <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: '#0f172a' }}>
                🖥️ System Status
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#dcfce7', borderRadius: 6 }}>
                  <span style={{ color: '#166534' }}>✅ API</span>
                  <span style={{ fontSize: '0.75rem', color: '#166534' }}>Online</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#dcfce7', borderRadius: 6 }}>
                  <span style={{ color: '#166534' }}>✅ Database</span>
                  <span style={{ fontSize: '0.75rem', color: '#166534' }}>Connected</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
