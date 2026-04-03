'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Store {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  isActive: boolean;
  isPublic: boolean;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  currency: string;
}

interface StoreStats {
  todayRevenue: number;
  todayOrders: number;
  weekRevenue: number;
  weekOrders: number;
  monthRevenue: number;
  monthOrders: number;
}

export default function UserDashboard() {
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState<Store | null>(null);
  const [stats, setStats] = useState<StoreStats | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchUserStore();
  }, []);

  async function fetchUserStore() {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://zyloshippingbackend-production.up.railway.app';
      const res = await fetch(`${apiUrl}/api/user/store`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStore(data.store);
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch store:', err);
    } finally {
      setLoading(false);
    }
  }

  async function createStore() {
    if (!newStoreName.trim()) return;
    
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://zyloshippingbackend-production.up.railway.app';
      const res = await fetch(`${apiUrl}/api/user/store`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ name: newStoreName })
      });
      
      if (res.ok) {
        const data = await res.json();
        setStore(data.store);
        setShowCreateModal(false);
        setNewStoreName('');
      } else {
        const errorData = await res.json().catch(() => null);
        console.error('Failed to create store:', errorData || res.statusText);
      }
    } catch (err) {
      console.error('Failed to create store:', err);
    }
  }

  function handleLogout() {
    localStorage.removeItem('token');
    router.push('/login');
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ fontSize: '1.2rem', color: '#64748b' }}>Loading...</div>
      </div>
    );
  }

  // No store - Show create store prompt
  if (!store) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'var(--sans)' }}>
        <header style={{ background: 'white', padding: '1rem 2rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 36, height: 36, background: '#dc2626', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'var(--serif)', fontWeight: 900, color: 'white', fontSize: '1.2rem' }}>Z</span>
            </div>
            <span style={{ fontFamily: 'var(--serif)', fontSize: '1.3rem', fontWeight: 900, color: '#0f172a' }}>
              Zylo<span style={{ color: '#dc2626' }}>.</span>
            </span>
          </div>
          <button onClick={handleLogout} style={{ padding: '0.5rem 1rem', background: '#f1f5f9', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
            Logout
          </button>
        </header>

        <div style={{ maxWidth: 600, margin: '4rem auto', textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🏪</div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: '2rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>
            Create Your Store
          </h1>
          <p style={{ fontSize: '1rem', color: '#64748b', marginBottom: '2rem', lineHeight: 1.6 }}>
            You don&apos;t have a store yet. Create one now to start selling products and earning money.
          </p>
          <button onClick={() => setShowCreateModal(true)} style={{ padding: '1rem 2rem', background: '#dc2626', color: 'white', border: 'none', borderRadius: 8, fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }}>
            + Create Your Store
          </button>
        </div>

        {showCreateModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <div style={{ background: 'white', borderRadius: 8, padding: '2rem', width: '100%', maxWidth: 400 }}>
              <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', marginBottom: '1rem' }}>Create Store</h2>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Store Name</label>
                <input type="text" value={newStoreName} onChange={(e) => setNewStoreName(e.target.value)} placeholder="My Awesome Store" style={{ width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: '1rem' }} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={() => setShowCreateModal(false)} style={{ flex: 1, padding: '0.75rem', background: '#f1f5f9', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
                <button onClick={createStore} style={{ flex: 1, padding: '0.75rem', background: '#dc2626', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500 }}>Create</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Has store - Show dashboard
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'var(--sans)' }}>
      <header style={{ background: 'white', padding: '1rem 2rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 36, height: 36, background: '#dc2626', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'var(--serif)', fontWeight: 900, color: 'white', fontSize: '1.2rem' }}>Z</span>
          </div>
          <span style={{ fontFamily: 'var(--serif)', fontSize: '1.3rem', fontWeight: 900, color: '#0f172a' }}>Zylo<span style={{ color: '#dc2626' }}>.</span></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.875rem', color: '#64748b' }}>👤 {store.name}</span>
          <button onClick={handleLogout} style={{ padding: '0.5rem 1rem', background: '#f1f5f9', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Logout</button>
        </div>
      </header>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--serif)', fontSize: '1.8rem', fontWeight: 700, color: '#0f172a' }}>{store.name}</h1>
            <p style={{ color: '#64748b' }}>Your Store Dashboard</p>
          </div>
          <Link href={`/store/${store.slug}`} target="_blank" style={{ padding: '0.75rem 1.5rem', background: '#0f172a', color: 'white', borderRadius: 6, textDecoration: 'none', fontWeight: 500 }}>👁️ View Store</Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '1.5rem' }}>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>TODAY&apos;S REVENUE</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#0f172a' }}>{store.currency} {stats?.todayRevenue?.toLocaleString() ?? '0'}</div>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>{stats?.todayOrders ?? '0'} orders</div>
          </div>
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '1.5rem' }}>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>THIS WEEK</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#0f172a' }}>{store.currency} {stats?.weekRevenue?.toLocaleString() ?? '0'}</div>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>{stats?.weekOrders ?? '0'} orders</div>
          </div>
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '1.5rem' }}>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>THIS MONTH</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#0f172a' }}>{store.currency} {stats?.monthRevenue?.toLocaleString() ?? '0'}</div>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>{stats?.monthOrders ?? '0'} orders</div>
          </div>
        </div>

        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '1.5rem', marginBottom: '2rem' }}>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: '#0f172a' }}>Manage Your Store</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            <Link href="/dashboard/products" style={{ padding: '1rem', background: '#fef3c7', borderRadius: 8, textDecoration: 'none', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem' }}>🏷️</div>
              <div style={{ fontWeight: 600, color: '#0f172a' }}>Products</div>
              <div style={{ fontSize: '0.875rem', color: '#64748b' }}>{store.totalProducts} items</div>
            </Link>
            <Link href="/dashboard/orders" style={{ padding: '1rem', background: '#dbeafe', borderRadius: 8, textDecoration: 'none', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem' }}>📦</div>
              <div style={{ fontWeight: 600, color: '#0f172a' }}>Orders</div>
              <div style={{ fontSize: '0.875rem', color: '#64748b' }}>{store.totalOrders} total</div>
            </Link>
            <Link href="/dashboard/analytics" style={{ padding: '1rem', background: '#dcfce7', borderRadius: 8, textDecoration: 'none', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem' }}>📊</div>
              <div style={{ fontWeight: 600, color: '#0f172a' }}>Analytics</div>
            </Link>
            <Link href="/dashboard/settings" style={{ padding: '1rem', background: '#fce7f3', borderRadius: 8, textDecoration: 'none', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem' }}>⚙️</div>
              <div style={{ fontWeight: 600, color: '#0f172a' }}>Settings</div>
            </Link>
          </div>
        </div>

        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '1.5rem' }}>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: '#0f172a' }}>Store Performance</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            <div style={{ textAlign: 'center', padding: '1rem', background: '#f8fafc', borderRadius: 6 }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{store.totalProducts}</div>
              <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Products</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', background: '#f8fafc', borderRadius: 6 }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{store.totalOrders}</div>
              <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Orders</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', background: '#f8fafc', borderRadius: 6 }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{store.currency} {store.totalRevenue?.toLocaleString() ?? '0'}</div>
              <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Revenue</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', background: '#f8fafc', borderRadius: 6 }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: store.isActive ? '#16a34a' : '#dc2626' }}>{store.isActive ? 'Active' : 'Inactive'}</div>
              <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Status</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
