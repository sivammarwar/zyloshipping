'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard',           icon: '◈' },
  { label: 'Orders',    href: '/dashboard/orders',    icon: '📦' },
  { label: 'Products',  href: '/dashboard/products',  icon: '🏷' },
  { label: 'Suppliers', href: '/dashboard/suppliers', icon: '🔗' },
  { label: 'Analytics', href: '/dashboard/analytics', icon: '📊' },
  { label: 'AI Agents', href: '/dashboard/agents',    icon: '🤖' },
  { label: 'Pricing',   href: '/dashboard/pricing',   icon: '💰', active: true },
  { label: 'Settings',  href: '/dashboard/settings',  icon: '⚙️' },
];

interface PricingPlan {
  id: string;
  planId: string;
  name: string;
  tagline: string;
  monthlyPrice: number;
  annualPrice: number;
  isHighlight: boolean;
  badge?: string;
  ctaText: string;
  features: string[];
  limits: string[];
  displayOrder: number;
}

export default function AdminPricingPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  async function fetchPlans() {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/pricing`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setPlans(data.plans || []);
    } catch (error) {
      console.error('Failed to fetch pricing plans:', error);
    } finally {
      setLoading(false);
    }
  }

  async function savePlan(plan: Partial<PricingPlan>) {
    try {
      const token = localStorage.getItem('token');
      const url = plan.id
        ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/pricing/${plan.id}`
        : `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/pricing`;
      
      const res = await fetch(url, {
        method: plan.id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(plan),
      });

      if (res.ok) {
        await fetchPlans();
        setShowModal(false);
        setEditingPlan(null);
      }
    } catch (error) {
      console.error('Failed to save pricing plan:', error);
    }
  }

  function formatPrice(paise: number) {
    return `₹${(paise / 100).toLocaleString()}`;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--off-white)', fontFamily: 'var(--sans)' }}>
      
      {/* Sidebar */}
      <aside style={{ width: sidebarOpen ? 220 : 64, background: 'var(--ink)', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50, transition: 'width 0.25s', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
          <div style={{ width: 32, height: 32, background: 'var(--red)', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontFamily: 'var(--serif)', fontWeight: 900, color: 'white', fontSize: '1rem' }}>Z</span>
          </div>
          {sidebarOpen && <span style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', fontWeight: 900, color: 'white', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>Zylo<span style={{ color: 'var(--red)' }}>.</span></span>}
        </div>
        <nav style={{ flex: 1, padding: '1rem 0', overflowY: 'auto' }}>
          {NAV_ITEMS.map(item => (
            <Link key={item.href} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.7rem 1.25rem', color: item.active ? 'var(--white)' : 'rgba(255,255,255,0.45)', background: item.active ? 'rgba(196,30,58,0.18)' : 'transparent', borderLeft: `3px solid ${item.active ? 'var(--red)' : 'transparent'}`, textDecoration: 'none', fontSize: '0.84rem', fontWeight: item.active ? 500 : 300, whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
              <span style={{ fontSize: '1rem', flexShrink: 0 }}>{item.icon}</span>
              {sidebarOpen && item.label}
            </Link>
          ))}
        </nav>
        <button onClick={() => setSidebarOpen(v => !v)} style={{ margin: '1rem', padding: '0.6rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2, color: 'rgba(255,255,255,0.45)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ transform: sidebarOpen ? 'rotate(0)' : 'rotate(180deg)', transition: 'transform 0.25s' }}><path d="M9 2L4 7l5 5"/></svg>
        </button>
      </aside>

      <main style={{ marginLeft: sidebarOpen ? 220 : 64, flex: 1, transition: 'margin-left 0.25s', minHeight: '100vh' }}>
        
        {/* Top bar */}
        <div style={{ background: 'var(--white)', borderBottom: '1px solid var(--border)', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 40 }}>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--red)' }}>Admin</div>
            <h1 style={{ fontFamily: 'var(--serif)', fontSize: '1.4rem', fontWeight: 900, color: 'var(--ink)', letterSpacing: '-0.02em' }}>Pricing Management</h1>
          </div>
          <button onClick={() => { setEditingPlan(null); setShowModal(true); }} style={{ padding: '0.6rem 1.2rem', background: 'var(--red)', color: 'white', border: 'none', borderRadius: 2, fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer' }}>
            + Add Plan
          </button>
        </div>

        <div style={{ padding: '2rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--ink-faint)' }}>Loading pricing plans...</div>
          ) : plans.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💰</div>
              <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.5rem' }}>No Pricing Plans</h2>
              <p style={{ color: 'var(--ink-faint)', marginBottom: '1.5rem' }}>Create your first pricing plan to get started</p>
              <button onClick={() => { setEditingPlan(null); setShowModal(true); }} style={{ padding: '0.7rem 1.5rem', background: 'var(--red)', color: 'white', border: 'none', borderRadius: 2, fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer' }}>
                Create Plan
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {plans.map(plan => (
                <div key={plan.id} style={{ background: 'var(--white)', border: plan.isHighlight ? '2px solid var(--red)' : '1px solid var(--border)', borderRadius: 4, padding: '1.5rem', position: 'relative' }}>
                  {plan.badge && (
                    <div style={{ position: 'absolute', top: -10, right: 10, background: 'var(--red)', color: 'white', fontSize: '0.65rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: 2 }}>{plan.badge}</div>
                  )}
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontFamily: 'var(--serif)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.25rem' }}>{plan.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--ink-faint)', marginBottom: '0.75rem' }}>{plan.tagline}</div>
                    <div style={{ fontSize: '1.8rem', fontFamily: 'var(--serif)', fontWeight: 900, color: plan.isHighlight ? 'var(--red)' : 'var(--ink)' }}>
                      {plan.monthlyPrice === 0 ? 'Free' : formatPrice(plan.monthlyPrice)}
                      {plan.monthlyPrice > 0 && <span style={{ fontSize: '0.75rem', color: 'var(--ink-faint)', fontWeight: 400 }}>/mo</span>}
                    </div>
                    {plan.annualPrice > 0 && plan.annualPrice !== plan.monthlyPrice && (
                      <div style={{ fontSize: '0.72rem', color: '#16a34a', marginTop: '0.25rem' }}>
                        Annual: {formatPrice(plan.annualPrice)}/mo
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', marginBottom: '1rem' }}>
                    <div style={{ fontWeight: 500, marginBottom: '0.5rem' }}>Features:</div>
                    {plan.features.slice(0, 3).map((f, i) => (
                      <div key={i}>• {f}</div>
                    ))}
                    {plan.features.length > 3 && <div style={{ color: 'var(--ink-faint)' }}>+ {plan.features.length - 3} more</div>}
                  </div>
                  <button onClick={() => { setEditingPlan(plan); setShowModal(true); }} style={{ width: '100%', padding: '0.6rem', background: 'var(--ink)', color: 'white', border: 'none', borderRadius: 2, fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer' }}>
                    Edit Plan
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <PricingModal
          plan={editingPlan}
          onSave={savePlan}
          onClose={() => { setShowModal(false); setEditingPlan(null); }}
        />
      )}

      <style jsx>{`
        @media (max-width: 768px) {
          main { margin-left: 64px !important; }
        }
      `}</style>
    </div>
  );
}

function PricingModal({ plan, onSave, onClose }: { plan: PricingPlan | null; onSave: (plan: Partial<PricingPlan>) => void; onClose: () => void }) {
  const [formData, setFormData] = useState<Partial<PricingPlan>>(plan || {
    planId: '',
    name: '',
    tagline: '',
    monthlyPrice: 0,
    annualPrice: 0,
    isHighlight: false,
    badge: '',
    ctaText: '',
    features: [],
    limits: [],
    displayOrder: 0,
  });

  const [featureInput, setFeatureInput] = useState('');
  const [limitInput, setLimitInput] = useState('');

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '2rem' }} onClick={onClose}>
      <div style={{ background: 'var(--white)', borderRadius: 4, padding: '2rem', maxWidth: 600, width: '100%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>{plan ? 'Edit Plan' : 'Create Plan'}</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--ink-muted)', display: 'block', marginBottom: '0.25rem' }}>Plan ID (e.g., starter, growth, pro)</label>
            <input type="text" value={formData.planId} onChange={e => setFormData({ ...formData, planId: e.target.value })} style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border)', borderRadius: 2, fontSize: '0.85rem' }} />
          </div>
          
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--ink-muted)', display: 'block', marginBottom: '0.25rem' }}>Name</label>
            <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border)', borderRadius: 2, fontSize: '0.85rem' }} />
          </div>
          
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--ink-muted)', display: 'block', marginBottom: '0.25rem' }}>Tagline</label>
            <input type="text" value={formData.tagline} onChange={e => setFormData({ ...formData, tagline: e.target.value })} style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border)', borderRadius: 2, fontSize: '0.85rem' }} />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--ink-muted)', display: 'block', marginBottom: '0.25rem' }}>Monthly Price (₹)</label>
              <input type="number" value={formData.monthlyPrice ? formData.monthlyPrice / 100 : 0} onChange={e => setFormData({ ...formData, monthlyPrice: Math.round(parseFloat(e.target.value) * 100) })} style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border)', borderRadius: 2, fontSize: '0.85rem' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--ink-muted)', display: 'block', marginBottom: '0.25rem' }}>Annual Price (₹/mo)</label>
              <input type="number" value={formData.annualPrice ? formData.annualPrice / 100 : 0} onChange={e => setFormData({ ...formData, annualPrice: Math.round(parseFloat(e.target.value) * 100) })} style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border)', borderRadius: 2, fontSize: '0.85rem' }} />
            </div>
          </div>
          
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--ink-muted)', display: 'block', marginBottom: '0.25rem' }}>CTA Text</label>
            <input type="text" value={formData.ctaText} onChange={e => setFormData({ ...formData, ctaText: e.target.value })} style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border)', borderRadius: 2, fontSize: '0.85rem' }} />
          </div>
          
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--ink-muted)', display: 'block', marginBottom: '0.25rem' }}>Badge (optional)</label>
            <input type="text" value={formData.badge || ''} onChange={e => setFormData({ ...formData, badge: e.target.value })} style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border)', borderRadius: 2, fontSize: '0.85rem' }} />
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
              <input type="checkbox" checked={formData.isHighlight} onChange={e => setFormData({ ...formData, isHighlight: e.target.checked })} />
              Highlight this plan
            </label>
          </div>
          
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--ink-muted)', display: 'block', marginBottom: '0.25rem' }}>Features</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input type="text" value={featureInput} onChange={e => setFeatureInput(e.target.value)} placeholder="Add feature..." style={{ flex: 1, padding: '0.6rem', border: '1px solid var(--border)', borderRadius: 2, fontSize: '0.85rem' }} />
              <button onClick={() => { if (featureInput.trim()) { setFormData({ ...formData, features: [...(formData.features || []), featureInput.trim()] }); setFeatureInput(''); } }} style={{ padding: '0.6rem 1rem', background: 'var(--ink)', color: 'white', border: 'none', borderRadius: 2, fontSize: '0.8rem', cursor: 'pointer' }}>Add</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {(formData.features || []).map((f, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.6rem', background: 'var(--off-white)', borderRadius: 2, fontSize: '0.8rem' }}>
                  <span>{f}</span>
                  <button onClick={() => setFormData({ ...formData, features: formData.features?.filter((_, idx) => idx !== i) })} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: '0.75rem' }}>Remove</button>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--ink-muted)', display: 'block', marginBottom: '0.25rem' }}>Limits</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input type="text" value={limitInput} onChange={e => setLimitInput(e.target.value)} placeholder="Add limit..." style={{ flex: 1, padding: '0.6rem', border: '1px solid var(--border)', borderRadius: 2, fontSize: '0.85rem' }} />
              <button onClick={() => { if (limitInput.trim()) { setFormData({ ...formData, limits: [...(formData.limits || []), limitInput.trim()] }); setLimitInput(''); } }} style={{ padding: '0.6rem 1rem', background: 'var(--ink)', color: 'white', border: 'none', borderRadius: 2, fontSize: '0.8rem', cursor: 'pointer' }}>Add</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {(formData.limits || []).map((l, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.6rem', background: 'var(--off-white)', borderRadius: 2, fontSize: '0.8rem' }}>
                  <span>{l}</span>
                  <button onClick={() => setFormData({ ...formData, limits: formData.limits?.filter((_, idx) => idx !== i) })} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: '0.75rem' }}>Remove</button>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button onClick={() => onSave(formData)} style={{ flex: 1, padding: '0.7rem', background: 'var(--red)', color: 'white', border: 'none', borderRadius: 2, fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer' }}>
            {plan ? 'Update Plan' : 'Create Plan'}
          </button>
          <button onClick={onClose} style={{ flex: 1, padding: '0.7rem', background: 'var(--off-white)', color: 'var(--ink)', border: '1px solid var(--border)', borderRadius: 2, fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
