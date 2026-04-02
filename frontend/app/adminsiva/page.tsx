'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const FOUNDER_EMAIL = 'shivamkumarsingh8544@gmail.com';

interface StoreSettings {
  storeName: string;
  currency: string;
  maintenanceMode: boolean;
  markupPercent: number;
  activeCouponCode: string;
  couponDiscountPct: number;
}

export default function FounderAdminPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [settings, setSettings] = useState<StoreSettings>({
    storeName: 'ZyloShipping',
    currency: 'INR',
    maintenanceMode: false,
    markupPercent: 2.5,
    activeCouponCode: '',
    couponDiscountPct: 10,
  });

  // Check founder auth
  useEffect(() => {
    const founderToken = localStorage.getItem('founder_token');
    const founderEmail = localStorage.getItem('founder_email');
    
    if (!founderToken || founderEmail !== FOUNDER_EMAIL) {
      window.location.href = '/adminsiva/login';
      return;
    }
    
    // Load settings from backend
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(prev => ({ ...prev, ...data }));
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  }

  async function saveSettings() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        setMessage('✓ Saved successfully');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('✗ Failed to save');
      }
    } catch (err) {
      setMessage('✗ Error saving');
    }
    setLoading(false);
  }

  function handleLogout() {
    localStorage.removeItem('founder_token');
    localStorage.removeItem('founder_email');
    window.location.href = '/adminsiva/login';
  }

  const Card = ({ title, children, color = 'var(--white)' }: any) => (
    <div style={{ background: color, border: '1px solid var(--border)', borderRadius: 4, padding: '1.5rem' }}>
      <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '1rem' }}>{title}</h3>
      {children}
    </div>
  );

  const Input = ({ label, value, onChange, type = 'text' }: any) => (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '0.35rem' }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(type === 'checkbox' ? e.target.checked : e.target.value)}
        style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border)', borderRadius: 2, fontSize: '0.9rem' }}
      />
    </div>
  );

  const Checkbox = ({ label, checked, onChange }: any) => (
    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: '0.75rem' }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ width: 18, height: 18 }} />
      <span style={{ fontSize: '0.85rem', color: 'var(--ink)' }}>{label}</span>
    </label>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--off-white)', fontFamily: 'var(--sans)' }}>
      {/* Header */}
      <header style={{ background: 'var(--ink)', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 32, height: 32, background: 'var(--red)', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'var(--serif)', fontWeight: 900, color: 'white', fontSize: '1rem' }}>Z</span>
          </div>
          <span style={{ fontFamily: 'var(--serif)', fontSize: '1.2rem', fontWeight: 900, color: 'white' }}>
            Zylo<span style={{ color: 'var(--red)' }}>.</span> <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontWeight: 400 }}>Founder Panel</span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {message && (
            <span style={{ fontSize: '0.8rem', color: message.startsWith('✓') ? '#22c55e' : '#ef4444' }}>{message}</span>
          )}
          <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>👑 {FOUNDER_EMAIL}</span>
          <button onClick={handleLogout} style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem' }}>
            Logout
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div style={{ background: 'var(--white)', borderBottom: '1px solid var(--border)', padding: '0 2rem' }}>
        <div style={{ display: 'flex', gap: '2rem' }}>
          {['overview', 'store', 'pricing', 'system'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '1rem 0',
                background: 'transparent',
                border: 'none',
                borderBottom: `2px solid ${activeTab === tab ? 'var(--red)' : 'transparent'}`,
                color: activeTab === tab ? 'var(--red)' : 'var(--ink-muted)',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 500,
                textTransform: 'capitalize',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '2rem', maxWidth: 1200, margin: '0 auto' }}>
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
            <Card title="📊 Total Revenue" color="#fef3c7">
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--ink)' }}>₹0.00</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-faint)' }}>Lifetime revenue</div>
            </Card>
            <Card title="🛒 Total Orders" color="#dbeafe">
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--ink)' }}>0</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-faint)' }}>All time orders</div>
            </Card>
            <Card title="👥 Total Users" color="#dcfce7">
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--ink)' }}>0</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-faint)' }}>Registered customers</div>
            </Card>
            <Card title="🏪 Active Stores" color="#fce7f3">
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--ink)' }}>1</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-faint)' }}>Store instances</div>
            </Card>

            <div style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
              <Card title="⚡ Quick Actions">
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <Link href="/dashboard" style={{ padding: '0.75rem 1.5rem', background: 'var(--red)', color: 'white', borderRadius: 4, textDecoration: 'none', fontSize: '0.85rem' }}>
                    🏪 Go to Store Dashboard
                  </Link>
                  <button onClick={() => setActiveTab('store')} style={{ padding: '0.75rem 1.5rem', background: 'var(--off-white)', border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer', fontSize: '0.85rem' }}>
                    ⚙️ Edit Store Settings
                  </button>
                  <button onClick={() => setActiveTab('pricing')} style={{ padding: '0.75rem 1.5rem', background: 'var(--off-white)', border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer', fontSize: '0.85rem' }}>
                    💰 Pricing Rules
                  </button>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* STORE SETTINGS TAB */}
        {activeTab === 'store' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
            <Card title="🏪 Store Identity">
              <Input label="Store Name" value={settings.storeName} onChange={(v: string) => setSettings({ ...settings, storeName: v })} />
              <Input label="Currency" value={settings.currency} onChange={(v: string) => setSettings({ ...settings, currency: v })} />
              <Checkbox label="🔒 Maintenance Mode" checked={settings.maintenanceMode} onChange={(v: boolean) => setSettings({ ...settings, maintenanceMode: v })} />
              <p style={{ fontSize: '0.75rem', color: 'var(--ink-faint)', marginTop: '0.5rem' }}>
                When enabled, only admins can access the store
              </p>
            </Card>

            <Card title="💰 Pricing & Coupons">
              <Input label="Markup Multiplier" type="number" step="0.1" value={settings.markupPercent} onChange={(v: string) => setSettings({ ...settings, markupPercent: Number(v) })} />
              <p style={{ fontSize: '0.75rem', color: 'var(--ink-faint)', marginBottom: '1rem' }}>
                Product price = Supplier cost × {settings.markupPercent}
              </p>
              <Input label="Active Coupon Code" value={settings.activeCouponCode} onChange={(v: string) => setSettings({ ...settings, activeCouponCode: v })} />
              <Input label="Coupon Discount %" type="number" value={settings.couponDiscountPct} onChange={(v: string) => setSettings({ ...settings, couponDiscountPct: Number(v) })} />
            </Card>

            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={saveSettings}
                disabled={loading}
                style={{
                  padding: '0.75rem 2rem',
                  background: 'var(--red)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? 'Saving...' : '💾 Save Changes'}
              </button>
            </div>
          </div>
        )}

        {/* PRICING TAB */}
        {activeTab === 'pricing' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
            {['Starter', 'Growth', 'Pro'].map((plan) => (
              <Card key={plan} title={`💎 ${plan} Plan`}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '0.35rem' }}>Monthly Price (₹)</label>
                  <input type="number" defaultValue={plan === 'Starter' ? 999 : plan === 'Growth' ? 2999 : 5999} style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border)', borderRadius: 2 }} />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '0.35rem' }}>Features (one per line)</label>
                  <textarea defaultValue={"10 products\nBasic analytics\nEmail support"} style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border)', borderRadius: 2, minHeight: 80, fontSize: '0.85rem', fontFamily: 'inherit' }} />
                </div>
                <button style={{ width: '100%', padding: '0.5rem', background: 'var(--off-white)', border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem' }}>
                  Update {plan} Plan
                </button>
              </Card>
            ))}
          </div>
        )}

        {/* SYSTEM TAB */}
        {activeTab === 'system' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
            <Card title="🗄️ Database">
              <p style={{ fontSize: '0.85rem', color: 'var(--ink-faint)', marginBottom: '1rem' }}>
                Backup and manage your database
              </p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button style={{ padding: '0.6rem 1rem', background: 'var(--red)', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem' }}>
                  📥 Backup Now
                </button>
                <button style={{ padding: '0.6rem 1rem', background: 'var(--off-white)', border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem' }}>
                  📤 Export Data
                </button>
              </div>
            </Card>

            <Card title="🤖 AI Agents">
              <p style={{ fontSize: '0.85rem', color: 'var(--ink-faint)', marginBottom: '1rem' }}>
                Control AI automation agents
              </p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Link href="/dashboard/agents" style={{ padding: '0.6rem 1rem', background: 'var(--red)', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'none' }}>
                  Manage Agents
                </Link>
              </div>
            </Card>

            <Card title="⚠️ Danger Zone" color="#fef2f2">
              <p style={{ fontSize: '0.85rem', color: '#991b1b', marginBottom: '1rem' }}>
                These actions cannot be undone
              </p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button style={{ padding: '0.6rem 1rem', background: '#dc2626', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem' }}>
                  Clear Cache
                </button>
                <button style={{ padding: '0.6rem 1rem', background: '#7f1d1d', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem' }}>
                  Reset All Data
                </button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
