'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import UserAuthGuard from '@/components/auth/UserAuthGuard';

type Section = 'account' | 'notifications' | 'payment' | 'privacy' | 'danger';

const SECTIONS: { key: Section; label: string; icon: string }[] = [
  { key: 'account',       label: 'Account',            icon: '👤' },
  { key: 'notifications', label: 'Notifications',      icon: '🔔' },
  { key: 'payment',       label: 'Payment Methods',    icon: '💳' },
  { key: 'privacy',       label: 'Privacy & Security', icon: '🔒' },
  { key: 'danger',        label: 'Danger Zone',        icon: '⚠️' },
];

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <div onClick={onChange} style={{ width: 40, height: 22, borderRadius: 11, background: on ? 'var(--red)' : 'var(--border)', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', width: 16, height: 16, borderRadius: '50%', background: 'var(--white)', top: 3, left: on ? 21 : 3, transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.18)' }} />
    </div>
  );
}

function SettingRow({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.1rem 0', borderBottom: '1px solid var(--border)', gap: '2rem', flexWrap: 'wrap' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--ink)', marginBottom: desc ? '0.2rem' : 0 }}>{label}</div>
        {desc && <div style={{ fontSize: '0.75rem', color: 'var(--ink-faint)', fontWeight: 300, lineHeight: 1.5 }}>{desc}</div>}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '1.75rem', marginBottom: '1.5rem' }}>
      <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.25rem', letterSpacing: '-0.01em' }}>{title}</h2>
      <div style={{ borderBottom: '1px solid var(--border)', marginBottom: '0.25rem' }} />
      {children}
    </div>
  );
}

function InputField({ label, value, onChange, type = 'text', placeholder = '' }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      <label style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ padding: '0.65rem 0.85rem', border: `1.5px solid ${focused ? 'var(--red)' : 'var(--border)'}`, borderRadius: 2, fontSize: '0.88rem', fontFamily: 'var(--sans)', color: 'var(--ink)', outline: 'none', transition: 'border-color 0.2s', background: 'var(--white)' }} />
    </div>
  );
}

function SettingsContent() {
  const [section, setSection] = useState<Section>('account');
  const [saved, setSaved]     = useState(false);

  const [name, setName]     = useState('');
  const [email, setEmail]   = useState('');
  const [phone, setPhone]   = useState('');
  const [currency, setCurrency] = useState('USD');

  const [notifs, setNotifs] = useState({
    orderUpdates: true, promotions: true, newArrivals: false,
    priceDrops: true, supportReplies: true, newsletter: false,
    sms: true, pushBrowser: false,
  });
  function toggleNotif(key: keyof typeof notifs) { setNotifs(n => ({ ...n, [key]: !n[key] })); }

  const [privacy, setPrivacy] = useState({
    twoFactor: false, loginAlerts: true, dataSharing: false, activityVisible: true,
  });
  function togglePrivacy(key: keyof typeof privacy) { setPrivacy(p => ({ ...p, [key]: !p[key] })); }

  const cards = [
    { id: '1', brand: 'Visa',       last4: '4242', expiry: '08/27', default: true  },
    { id: '2', brand: 'Mastercard', last4: '8888', expiry: '02/26', default: false },
  ];

  function handleSave() { setSaved(true); setTimeout(() => setSaved(false), 2500); }

  return (
    <>
      <Header />
      <main style={{ paddingTop: '5rem', background: 'var(--off-white)', minHeight: '100vh' }}>
        <div style={{ padding: '2rem 4vw 1.5rem', background: 'var(--white)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--red)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ display: 'inline-block', width: 16, height: 1, background: 'var(--red)' }} />
            Settings
          </div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--ink)' }}>Account Settings</h1>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '2.5rem', padding: '2.5rem 4vw 5rem', maxWidth: 1000, margin: '0 auto', alignItems: 'start' }}>

          <aside style={{ position: 'sticky', top: '5.5rem' }}>
            <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, overflow: 'hidden' }}>
              {SECTIONS.map((s, i) => (
                <button key={s.key} onClick={() => setSection(s.key)} style={{ width: '100%', padding: '0.85rem 1.25rem', background: section === s.key ? 'var(--red-light)' : 'transparent', border: 'none', borderLeft: `3px solid ${section === s.key ? 'var(--red)' : 'transparent'}`, borderBottom: i < SECTIONS.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.84rem', fontWeight: section === s.key ? 500 : 300, color: section === s.key ? 'var(--red)' : 'var(--ink-muted)', cursor: 'pointer', fontFamily: 'var(--sans)', textAlign: 'left', transition: 'all 0.15s' }}>
                  <span style={{ fontSize: '1rem' }}>{s.icon}</span>{s.label}
                </button>
              ))}
            </div>
          </aside>

          <div>
            {saved && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 2, padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.82rem', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 7l3.5 3.5L12 4"/></svg>
                Changes saved successfully
              </div>
            )}

            {section === 'account' && (
              <>
                <Card title="Personal Information">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', paddingTop: '1rem' }}>
                    <InputField label="Full Name"  value={name}  onChange={setName} />
                    <InputField label="Email"      value={email} onChange={setEmail} type="email" />
                    <InputField label="Phone"      value={phone} onChange={setPhone} type="tel" />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>Currency</label>
                      <select value={currency} onChange={e => setCurrency(e.target.value)} style={{ padding: '0.65rem 0.85rem', border: '1.5px solid var(--border)', borderRadius: 2, fontSize: '0.88rem', fontFamily: 'var(--sans)', outline: 'none', background: 'var(--white)', color: 'var(--ink)' }}>
                        {['USD','EUR','GBP','AUD','CAD','SGD','INR','JPY'].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                </Card>
                <Card title="Change Password">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '1rem' }}>
                    <InputField label="Current Password" value="" onChange={() => {}} type="password" placeholder="••••••••" />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <InputField label="New Password"     value="" onChange={() => {}} type="password" placeholder="Min 8 characters" />
                      <InputField label="Confirm Password" value="" onChange={() => {}} type="password" placeholder="Repeat new password" />
                    </div>
                  </div>
                </Card>
                <button onClick={handleSave} style={{ background: 'var(--red)', color: 'var(--white)', border: 'none', borderRadius: 2, padding: '0.75rem 2rem', fontSize: '0.88rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--sans)', boxShadow: '0 4px 18px rgba(196,30,58,0.22)' }}>Save changes</button>
              </>
            )}

            {section === 'notifications' && (
              <>
                <Card title="Email Notifications">
                  {([
                    { key: 'orderUpdates',   label: 'Order updates',     desc: 'Shipped, out for delivery, delivered' },
                    { key: 'promotions',     label: 'Promotions',        desc: 'Deals, flash sales, limited-time offers' },
                    { key: 'newArrivals',    label: 'New arrivals',      desc: 'When new products match your interests' },
                    { key: 'priceDrops',     label: 'Price drops',       desc: 'When wishlist items drop in price' },
                    { key: 'supportReplies', label: 'Support replies',   desc: 'When your support tickets are updated' },
                    { key: 'newsletter',     label: 'Weekly newsletter', desc: 'Curated picks and platform news' },
                  ] as { key: keyof typeof notifs; label: string; desc: string }[]).map(item => (
                    <SettingRow key={item.key} label={item.label} desc={item.desc}>
                      <Toggle on={notifs[item.key]} onChange={() => toggleNotif(item.key)} />
                    </SettingRow>
                  ))}
                </Card>
                <Card title="Other Channels">
                  {([
                    { key: 'sms',         label: 'SMS / Text messages', desc: 'Shipping updates to your phone number' },
                    { key: 'pushBrowser', label: 'Browser push',        desc: 'Real-time alerts in your browser' },
                  ] as { key: keyof typeof notifs; label: string; desc: string }[]).map(item => (
                    <SettingRow key={item.key} label={item.label} desc={item.desc}>
                      <Toggle on={notifs[item.key]} onChange={() => toggleNotif(item.key)} />
                    </SettingRow>
                  ))}
                </Card>
                <button onClick={handleSave} style={{ background: 'var(--red)', color: 'var(--white)', border: 'none', borderRadius: 2, padding: '0.75rem 2rem', fontSize: '0.88rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--sans)', boxShadow: '0 4px 18px rgba(196,30,58,0.22)' }}>Save preferences</button>
              </>
            )}

            {section === 'payment' && (
              <>
                <Card title="Saved Payment Methods">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '1rem' }}>
                    {cards.map(card => (
                      <div key={card.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', border: `1.5px solid ${card.default ? 'var(--red-mid)' : 'var(--border)'}`, borderRadius: 3, background: card.default ? 'var(--red-light)' : 'var(--white)', flexWrap: 'wrap' }}>
                        <div style={{ width: 40, height: 26, background: card.brand === 'Visa' ? '#1a1f71' : '#eb001b', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'white', letterSpacing: '0.05em' }}>{card.brand.toUpperCase()}</span>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--ink)' }}>{card.brand} ending in {card.last4}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--ink-faint)' }}>Expires {card.expiry}</div>
                        </div>
                        {card.default && <span style={{ fontSize: '0.62rem', fontWeight: 500, padding: '0.18rem 0.5rem', background: 'var(--red-light)', color: 'var(--red)', borderRadius: 1, border: '1px solid var(--red-mid)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Default</span>}
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {!card.default && <button style={{ fontSize: '0.72rem', color: 'var(--ink-faint)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-faint)'}>Set default</button>}
                          <button style={{ fontSize: '0.72rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)' }}>Remove</button>
                        </div>
                      </div>
                    ))}
                    <button style={{ padding: '0.75rem', border: '1.5px dashed var(--border)', borderRadius: 3, background: 'none', color: 'var(--ink-muted)', fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'var(--sans)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--red)'; e.currentTarget.style.color = 'var(--red)'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--ink-muted)'; }}>
                      <span style={{ fontSize: '1.1rem' }}>+</span> Add payment method
                    </button>
                  </div>
                </Card>
                <Card title="Billing Currency">
                  <SettingRow label="Display currency" desc="Prices shown across the store">
                    <select style={{ padding: '0.45rem 0.75rem', border: '1px solid var(--border)', borderRadius: 2, fontFamily: 'var(--sans)', fontSize: '0.82rem', outline: 'none' }}>
                      {['USD','EUR','GBP','AUD','CAD','SGD','INR','JPY'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </SettingRow>
                </Card>
              </>
            )}

            {section === 'privacy' && (
              <>
                <Card title="Security">
                  {([
                    { key: 'twoFactor',   label: 'Two-factor authentication', desc: 'Require a code from your authenticator app on login' },
                    { key: 'loginAlerts', label: 'Login alerts',               desc: 'Get an email when a new device logs into your account' },
                  ] as { key: keyof typeof privacy; label: string; desc: string }[]).map(item => (
                    <SettingRow key={item.key} label={item.label} desc={item.desc}>
                      <Toggle on={privacy[item.key]} onChange={() => togglePrivacy(item.key)} />
                    </SettingRow>
                  ))}
                </Card>
                <Card title="Data & Privacy">
                  {([
                    { key: 'dataSharing',     label: 'Analytics sharing',   desc: 'Help improve ZyloShipping by sharing anonymous usage data' },
                    { key: 'activityVisible', label: 'Profile visibility',  desc: 'Allow other sellers to see your seller profile' },
                  ] as { key: keyof typeof privacy; label: string; desc: string }[]).map(item => (
                    <SettingRow key={item.key} label={item.label} desc={item.desc}>
                      <Toggle on={privacy[item.key]} onChange={() => togglePrivacy(item.key)} />
                    </SettingRow>
                  ))}
                  <div style={{ paddingTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button style={{ padding: '0.6rem 1.1rem', background: 'none', border: '1px solid var(--border)', borderRadius: 2, fontSize: '0.8rem', color: 'var(--ink-muted)', cursor: 'pointer', fontFamily: 'var(--sans)' }}>Download my data</button>
                    <button style={{ padding: '0.6rem 1.1rem', background: 'none', border: '1px solid var(--border)', borderRadius: 2, fontSize: '0.8rem', color: 'var(--ink-muted)', cursor: 'pointer', fontFamily: 'var(--sans)' }}>View privacy policy</button>
                  </div>
                </Card>
                <button onClick={handleSave} style={{ background: 'var(--red)', color: 'var(--white)', border: 'none', borderRadius: 2, padding: '0.75rem 2rem', fontSize: '0.88rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--sans)', boxShadow: '0 4px 18px rgba(196,30,58,0.22)' }}>Save settings</button>
              </>
            )}

            {section === 'danger' && (
              <div style={{ background: 'var(--white)', border: '1.5px solid #fecaca', borderRadius: 4, padding: '1.75rem' }}>
                <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', fontWeight: 700, color: '#dc2626', marginBottom: '0.75rem' }}>Danger Zone</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', fontWeight: 300, marginBottom: '1.75rem', lineHeight: 1.65 }}>These actions are permanent and cannot be undone.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {[
                    { label: 'Deactivate account', desc: 'Temporarily disable your account. You can reactivate by logging in again.', btnLabel: 'Deactivate', color: '#d97706', bg: '#fef3c7' },
                    { label: 'Delete account',     desc: 'Permanently delete your account and all associated data. This cannot be undone.', btnLabel: 'Delete account', color: '#dc2626', bg: '#fef2f2' },
                  ].map(item => (
                    <div key={item.label} style={{ padding: '1.25rem', background: item.bg, border: `1px solid ${item.color}30`, borderRadius: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--ink)', marginBottom: '0.2rem' }}>{item.label}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', fontWeight: 300 }}>{item.desc}</div>
                      </div>
                      <button style={{ padding: '0.55rem 1.1rem', background: 'none', border: `1.5px solid ${item.color}`, borderRadius: 2, color: item.color, fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--sans)', flexShrink: 0 }}>{item.btnLabel}</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />

      <style>{`
        @media (max-width: 768px) {
          main > div[style*="grid-template-columns: 220px"] { grid-template-columns: 1fr !important; }
          aside { position: relative !important; top: auto !important; }
          div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}

export default function SettingsPage() {
  return (
    <UserAuthGuard>
      <SettingsContent />
    </UserAuthGuard>
  );
}