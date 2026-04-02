'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface StoreSettings {
  storeName: string;
  contactEmail: string;
  timezone: string;
  currency: string;
  storeUrl: string;
  tagline: string;
  supportEmail: string;
  maintenanceMode: boolean;
  emailOrders: boolean;
  emailLowStock: boolean;
  emailRefunds: boolean;
  smsOrders: boolean;
  freeShippingThreshold: number;
  defaultShippingRate: number;
  processingDays: number;
  markupPercent: number;
  priceFloor: number;
  priceCeiling: number;
  activeCouponCode: string;
  couponDiscountPct: number;
}

interface AgentState {
  id: string;
  name: string;
  status: string;
  isPaused: boolean;
}

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: '◈' },
  { label: 'Orders', href: '/dashboard/orders', icon: '📦' },
  { label: 'Products', href: '/dashboard/products', icon: '🏷' },
  { label: 'Suppliers', href: '/dashboard/suppliers', icon: '🔗' },
  { label: 'Analytics', href: '/dashboard/analytics', icon: '📊' },
  { label: 'AI Agents', href: '/dashboard/agents', icon: '🤖' },
  { label: 'Settings', href: '/dashboard/settings', icon: '⚙️' },
  { label: 'Founder', href: '/dashboard/founder', icon: '👑', active: true },
];

const TABS = [
  { id: 'store', label: 'Store Settings' },
  { id: 'agents', label: 'AI Agents' },
  { id: 'pricing', label: 'Pricing Plans' },
  { id: 'commissions', label: 'Commissions' },
  { id: 'system', label: 'System' },
];

export default function FounderAdminPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('store');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [settings, setSettings] = useState<StoreSettings>({
    storeName: 'ZyloShipping',
    contactEmail: 'hello@zyloshipping.com',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    storeUrl: 'zyloshipping.com',
    tagline: "World's Fastest Dropshipping",
    supportEmail: 'support@zyloshipping.com',
    maintenanceMode: false,
    emailOrders: true,
    emailLowStock: true,
    emailRefunds: false,
    smsOrders: false,
    freeShippingThreshold: 200,
    defaultShippingRate: 9.99,
    processingDays: 1,
    markupPercent: 2.5,
    priceFloor: 99,
    priceCeiling: 99999,
    activeCouponCode: '',
    couponDiscountPct: 10,
  });
  const [agents, setAgents] = useState<AgentState[]>([]);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      window.location.href = '/login';
      return;
    }
    setToken(storedToken);
    fetchSettings(storedToken);
    fetchAgents(storedToken);
  }, []);

  async function fetchSettings(authToken: string) {
    try {
      const res = await fetch('/api/admin/settings', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(prev => ({ ...prev, ...data }));
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  }

  async function fetchAgents(authToken: string) {
    try {
      const res = await fetch('/api/admin/agents', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAgents(data.agents || []);
      }
    } catch (err) {
      console.error('Failed to load agents:', err);
    }
  }

  async function saveSettings() {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        setMessage('✓ Settings saved successfully');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('✗ Failed to save settings');
      }
    } catch (err) {
      setMessage('✗ Error saving settings');
    }
    setLoading(false);
  }

  async function toggleAgent(agentId: string, isPaused: boolean) {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/agents/${agentId}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isPaused })
      });
      if (res.ok) {
        setAgents(prev => prev.map(a => a.id === agentId ? { ...a, isPaused } : a));
        setMessage(`✓ Agent ${isPaused ? 'paused' : 'activated'}`);
        setTimeout(() => setMessage(''), 2000);
      }
    } catch (err) {
      console.error('Failed to toggle agent:', err);
    }
  }

  const InputField = ({ label, value, onChange, type = 'text', placeholder = '', min, max, step }: any) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1rem' }}>
      <label style={{ fontSize: '0.72rem', fontWeight: 500, textTransform: 'uppercase', color: 'var(--ink-faint)' }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(type === 'checkbox' ? e.target.checked : e.target.value)}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        style={{
          width: '100%',
          padding: '0.6rem 0.8rem',
          border: '1px solid var(--border)',
          borderRadius: 2,
          fontSize: '0.85rem',
          background: 'var(--white)',
          outline: 'none',
        }}
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
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--off-white)', fontFamily: 'var(--sans)' }}>
      {/* Sidebar */}
      <aside style={{ width: sidebarOpen ? 220 : 64, background: 'var(--ink)', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50, transition: 'width 0.25s', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 32, height: 32, background: 'var(--red)', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'var(--serif)', fontWeight: 900, color: 'white', fontSize: '1rem' }}>Z</span>
          </div>
          {sidebarOpen && <span style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', fontWeight: 900, color: 'white' }}>Zylo<span style={{ color: 'var(--red)' }}>.</span></span>}
        </div>
        <nav style={{ flex: 1, padding: '1rem 0' }}>
          {NAV_ITEMS.map(item => (
            <Link key={item.href} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.7rem 1.25rem', color: item.active ? 'var(--white)' : 'rgba(255,255,255,0.45)', background: item.active ? 'rgba(196,30,58,0.18)' : 'transparent', borderLeft: `3px solid ${item.active ? 'var(--red)' : 'transparent'}`, textDecoration: 'none', fontSize: '0.84rem' }}>
              <span>{item.icon}</span>
              {sidebarOpen && item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main style={{ marginLeft: sidebarOpen ? 220 : 64, flex: 1, minHeight: '100vh' }}>
        {/* Top bar */}
        <div style={{ background: 'var(--white)', borderBottom: '1px solid var(--border)', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 500, textTransform: 'uppercase', color: 'var(--red)' }}>Founder Admin</div>
            <h1 style={{ fontFamily: 'var(--serif)', fontSize: '1.4rem', fontWeight: 900, color: 'var(--ink)' }}>👑 Control Panel</h1>
          </div>
          {message && (
            <div style={{ padding: '0.5rem 1rem', background: message.startsWith('✓') ? '#dcfce7' : '#fee2e2', color: message.startsWith('✓') ? '#166534' : '#991b1b', borderRadius: 4, fontSize: '0.85rem' }}>
              {message}
            </div>
          )}
        </div>

        <div style={{ padding: '2rem' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '0.6rem 1.2rem',
                  background: activeTab === tab.id ? 'var(--red)' : 'transparent',
                  color: activeTab === tab.id ? 'white' : 'var(--ink-muted)',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Store Settings Tab */}
          {activeTab === 'store' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem' }}>
              <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '1.5rem' }}>
                <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--ink)' }}>🏪 General</h3>
                <InputField label="Store Name" value={settings.storeName} onChange={(v: string) => setSettings({ ...settings, storeName: v })} />
                <InputField label="Tagline" value={settings.tagline} onChange={(v: string) => setSettings({ ...settings, tagline: v })} />
                <InputField label="Store URL" value={settings.storeUrl} onChange={(v: string) => setSettings({ ...settings, storeUrl: v })} />
                <InputField label="Contact Email" value={settings.contactEmail} onChange={(v: string) => setSettings({ ...settings, contactEmail: v })} />
                <InputField label="Support Email" value={settings.supportEmail} onChange={(v: string) => setSettings({ ...settings, supportEmail: v })} />
                <InputField label="Currency" value={settings.currency} onChange={(v: string) => setSettings({ ...settings, currency: v })} />
                <InputField label="Timezone" value={settings.timezone} onChange={(v: string) => setSettings({ ...settings, timezone: v })} />
                <Checkbox label="Maintenance Mode" checked={settings.maintenanceMode} onChange={(v: boolean) => setSettings({ ...settings, maintenanceMode: v })} />
              </div>

              <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '1.5rem' }}>
                <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--ink)' }}>📦 Shipping</h3>
                <InputField label="Free Shipping Threshold" type="number" value={settings.freeShippingThreshold} onChange={(v: string) => setSettings({ ...settings, freeShippingThreshold: Number(v) })} />
                <InputField label="Default Shipping Rate" type="number" step="0.01" value={settings.defaultShippingRate} onChange={(v: string) => setSettings({ ...settings, defaultShippingRate: Number(v) })} />
                <InputField label="Processing Days" type="number" value={settings.processingDays} onChange={(v: string) => setSettings({ ...settings, processingDays: Number(v) })} />

                <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', marginTop: '1.5rem', marginBottom: '1rem', color: 'var(--ink)' }}>💰 Pricing Rules</h3>
                <InputField label="Markup %" type="number" step="0.1" value={settings.markupPercent} onChange={(v: string) => setSettings({ ...settings, markupPercent: Number(v) })} />
                <InputField label="Price Floor" type="number" value={settings.priceFloor} onChange={(v: string) => setSettings({ ...settings, priceFloor: Number(v) })} />
                <InputField label="Price Ceiling" type="number" value={settings.priceCeiling} onChange={(v: string) => setSettings({ ...settings, priceCeiling: Number(v) })} />

                <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', marginTop: '1.5rem', marginBottom: '1rem', color: 'var(--ink)' }}>🎟️ Coupon</h3>
                <InputField label="Active Coupon Code" value={settings.activeCouponCode || ''} onChange={(v: string) => setSettings({ ...settings, activeCouponCode: v })} placeholder="e.g. SUMMER2024" />
                <InputField label="Discount %" type="number" value={settings.couponDiscountPct} onChange={(v: string) => setSettings({ ...settings, couponDiscountPct: Number(v) })} />
              </div>

              <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '1.5rem' }}>
                <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--ink)' }}>🔔 Notifications</h3>
                <Checkbox label="Email on New Orders" checked={settings.emailOrders} onChange={(v: boolean) => setSettings({ ...settings, emailOrders: v })} />
                <Checkbox label="Email on Low Stock" checked={settings.emailLowStock} onChange={(v: boolean) => setSettings({ ...settings, emailLowStock: v })} />
                <Checkbox label="Email on Refunds" checked={settings.emailRefunds} onChange={(v: boolean) => setSettings({ ...settings, emailRefunds: v })} />
                <Checkbox label="SMS on Orders" checked={settings.smsOrders} onChange={(v: boolean) => setSettings({ ...settings, smsOrders: v })} />
              </div>

              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
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
                  {loading ? 'Saving...' : '💾 Save All Changes'}
                </button>
              </div>
            </div>
          )}

          {/* AI Agents Tab */}
          {activeTab === 'agents' && (
            <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '1.5rem' }}>
              <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', marginBottom: '1.5rem', color: 'var(--ink)' }}>🤖 AI Agent Control</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--ink-faint)', marginBottom: '1.5rem' }}>
                Enable or disable AI agents. Paused agents will not run automated tasks.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                {agents.length === 0 ? (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: 'var(--ink-faint)' }}>
                    Loading agents... (API endpoint needed)
                  </div>
                ) : (
                  agents.map(agent => (
                    <div key={agent.id} style={{ border: '1px solid var(--border)', borderRadius: 4, padding: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 500 }}>{agent.name}</span>
                        <span style={{ fontSize: '0.75rem', color: agent.isPaused ? '#ef4444' : '#22c55e' }}>
                          {agent.isPaused ? '⏸ Paused' : '▶ Active'}
                        </span>
                      </div>
                      <button
                        onClick={() => toggleAgent(agent.id, !agent.isPaused)}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          background: agent.isPaused ? '#22c55e' : '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                        }}
                      >
                        {agent.isPaused ? 'Activate' : 'Pause'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Other tabs placeholder */}
          {activeTab === 'pricing' && (
            <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '2rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💎</div>
              <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.3rem', color: 'var(--ink)', marginBottom: '0.5rem' }}>Pricing Plans Management</h3>
              <p style={{ color: 'var(--ink-faint)' }}>Configure subscription tiers and pricing plans</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--ink-faint)', marginTop: '1rem' }}>
                Edit via: <code>/dashboard/pricing</code> or database <code>pricing_plans</code> table
              </p>
            </div>
          )}

          {activeTab === 'commissions' && (
            <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '2rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💸</div>
              <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.3rem', color: 'var(--ink)', marginBottom: '0.5rem' }}>Commission Settings</h3>
              <p style={{ color: 'var(--ink-faint)' }}>Configure affiliate and partner commission rates</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--ink-faint)', marginTop: '1rem' }}>
                Current markup: <strong>{settings.markupPercent}x</strong> (configured in Store Settings)
              </p>
            </div>
          )}

          {activeTab === 'system' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
              <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '1.5rem' }}>
                <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--ink)' }}>🗄️ Database</h3>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <button style={{ padding: '0.5rem 1rem', background: 'var(--red)', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem' }}>
                    Backup Now
                  </button>
                  <button style={{ padding: '0.5rem 1rem', background: 'var(--off-white)', border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem' }}>
                    Export Data
                  </button>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--ink-faint)' }}>Last backup: Never</p>
              </div>

              <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '1.5rem' }}>
                <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--ink)' }}>🔑 API Keys</h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--ink-faint)', marginBottom: '1rem' }}>
                  Manage API keys for integrations
                </div>
                <button style={{ padding: '0.5rem 1rem', background: 'var(--red)', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem' }}>
                  View API Keys
                </button>
              </div>

              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 4, padding: '1.5rem', gridColumn: '1 / -1' }}>
                <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', marginBottom: '0.5rem', color: '#991b1b' }}>⚠️ Danger Zone</h3>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button style={{ padding: '0.5rem 1rem', background: '#dc2626', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem' }}>
                    Clear Cache
                  </button>
                  <button style={{ padding: '0.5rem 1rem', background: '#7f1d1d', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem' }}>
                    Reset All Data
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
