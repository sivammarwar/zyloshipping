'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

// ── Mock tracking data ────────────────────────────────────────
const MOCK_TRACKING: Record<string, {
  orderId: string; status: string; carrier: string;
  trackingNum: string; estimatedDelivery: string;
  origin: string; destination: string;
  events: { date: string; time: string; location: string; description: string; active?: boolean }[];
}> = {
  'ZY-28431': {
    orderId: 'ZY-28431',
    status: 'IN_TRANSIT',
    carrier: 'UPS',
    trackingNum: '1Z999AA10123456784',
    estimatedDelivery: 'March 30, 2026',
    origin: 'Guangzhou, CN',
    destination: 'New York, US',
    events: [
      { date: 'Mar 28', time: '09:42', location: 'Chicago, IL', description: 'Package in transit at sorting facility', active: true },
      { date: 'Mar 27', time: '22:18', location: 'Los Angeles, CA', description: 'Departed origin facility' },
      { date: 'Mar 26', time: '14:05', location: 'Los Angeles, CA', description: 'Arrived at domestic hub' },
      { date: 'Mar 25', time: '08:30', location: 'Guangzhou, CN', description: 'Cleared international customs' },
      { date: 'Mar 24', time: '16:00', location: 'Guangzhou, CN', description: 'Package picked up by carrier' },
      { date: 'Mar 24', time: '09:15', location: 'Guangzhou, CN', description: 'Order dispatched to supplier warehouse' },
    ],
  },
};

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; icon: string; progress: number }> = {
  IN_TRANSIT: { label: 'In Transit',        color: '#d97706', bg: '#fef3c7', icon: '🚚', progress: 65 },
  DELIVERED:  { label: 'Delivered',         color: '#16a34a', bg: '#f0fdf4', icon: '✅', progress: 100 },
  PROCESSING: { label: 'Processing',        color: 'var(--red)', bg: 'var(--red-light)', icon: '⚙️', progress: 20 },
  SHIPPED:    { label: 'Shipped',           color: '#2563eb', bg: '#eff6ff', icon: '📬', progress: 45 },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: '#7c3aed', bg: '#f5f3ff', icon: '🏠', progress: 85 },
};

const PROGRESS_STEPS = ['Order placed', 'Processing', 'Shipped', 'In transit', 'Out for delivery', 'Delivered'];
function getStep(status: string) {
  return { 'PROCESSING': 1, 'SHIPPED': 2, 'IN_TRANSIT': 3, 'OUT_FOR_DELIVERY': 4, 'DELIVERED': 5 }[status] ?? 0;
}

const CARRIERS = ['UPS', 'FedEx', 'USPS', 'DHL', 'Royal Mail', 'Australia Post', 'Japan Post'];

export default function TrackPage() {
  const [input, setInput]         = useState('');
  const [trackingData, setTrackingData] = useState<typeof MOCK_TRACKING[string] | null>(null);
  const [notFound, setNotFound]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [focused, setFocused]     = useState(false);

  function handleTrack() {
    if (!input.trim()) return;
    setLoading(true);
    setNotFound(false);
    setTrackingData(null);
    setTimeout(() => {
      const key = input.trim().toUpperCase();
      const result = MOCK_TRACKING[key];
      if (result) { setTrackingData(result); } else { setNotFound(true); }
      setLoading(false);
    }, 1200);
  }

  const stepIdx = trackingData ? getStep(trackingData.status) : 0;
  const statusCfg = trackingData ? STATUS_MAP[trackingData.status] : null;

  return (
    <>
      <Header />

      <main style={{ paddingTop: '5rem', background: 'var(--off-white)', minHeight: '100vh' }}>

        {/* ── Hero search ── */}
        <div style={{ background: 'var(--ink)', padding: '4rem 4vw 5rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'var(--red)', opacity: 0.06 }} />
          <div style={{ position: 'absolute', bottom: -60, left: -60, width: 250, height: 250, borderRadius: '50%', border: '40px solid rgba(255,255,255,0.03)' }} />

          <div style={{ maxWidth: 640, margin: '0 auto', position: 'relative', zIndex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--red)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <span style={{ display: 'inline-block', width: 16, height: 1, background: 'var(--red)' }} />
              Real-time Tracking
              <span style={{ display: 'inline-block', width: 16, height: 1, background: 'var(--red)' }} />
            </div>
            <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, color: 'var(--white)', letterSpacing: '-0.025em', lineHeight: 1.08, marginBottom: '0.75rem' }}>
              Track your order
            </h1>
            <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.5)', fontWeight: 300, marginBottom: '2.5rem' }}>
              Enter your ZyloShipping order ID or carrier tracking number
            </p>

            {/* Search input */}
            <div style={{ display: 'flex', gap: '0', background: 'var(--white)', borderRadius: 3, overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.25)', border: `2px solid ${focused ? 'var(--red)' : 'transparent'}`, transition: 'border-color 0.2s' }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleTrack()}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="e.g. ZY-28431 or 1Z999AA10123456784"
                style={{ flex: 1, padding: '0.95rem 1.25rem', border: 'none', fontSize: '0.92rem', fontFamily: 'var(--sans)', color: 'var(--ink)', outline: 'none', background: 'transparent', minWidth: 0 }}
              />
              <button
                onClick={handleTrack}
                disabled={loading}
                style={{ padding: '0 1.75rem', background: loading ? 'var(--red-deep)' : 'var(--red)', color: 'var(--white)', border: 'none', fontSize: '0.88rem', fontWeight: 500, cursor: loading ? 'default' : 'pointer', fontFamily: 'var(--sans)', letterSpacing: '0.03em', transition: 'background 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}
              >
                {loading ? (
                  <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                ) : (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round"><circle cx="6" cy="6" r="4"/><path d="M10 10l2.5 2.5"/></svg>
                )}
                {loading ? 'Tracking…' : 'Track'}
              </button>
            </div>

            {/* Tip */}
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', marginTop: '1rem' }}>
              Try: <button onClick={() => setInput('ZY-28431')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: '0.75rem', padding: 0, textDecoration: 'underline' }}>ZY-28431</button>
            </p>
          </div>
        </div>

        <div style={{ padding: '3rem 4vw 5rem', maxWidth: 900, margin: '0 auto' }}>

          {/* Not found */}
          {notFound && (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--white)', borderRadius: 4, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
              <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.5rem' }}>Order not found</h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--ink-muted)', fontWeight: 300 }}>
                Check your order ID or tracking number and try again. Orders may take up to 2 hours to appear.
              </p>
            </div>
          )}

          {/* Tracking result */}
          {trackingData && statusCfg && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

              {/* Status header */}
              <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '2rem', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', bottom: 0, left: 0, height: 3, background: 'var(--border)', right: 0 }}>
                  <div style={{ height: '100%', background: 'var(--red)', width: `${STATUS_MAP[trackingData.status].progress}%`, transition: 'width 0.8s cubic-bezier(0.22,1,0.36,1)', borderRadius: '0 2px 2px 0' }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.4rem', fontWeight: 900, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
                        #{trackingData.orderId}
                      </h2>
                      <span style={{ fontSize: '0.65rem', fontWeight: 500, padding: '0.22rem 0.6rem', borderRadius: 1, background: statusCfg.bg, color: statusCfg.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {statusCfg.icon} {statusCfg.label}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--ink-faint)' }}>
                      {trackingData.carrier} · {trackingData.trackingNum}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--ink-faint)', marginBottom: '0.2rem' }}>Estimated delivery</div>
                    <div style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink)' }}>{trackingData.estimatedDelivery}</div>
                  </div>
                </div>

                {/* Route */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.9rem 1.25rem', background: 'var(--off-white)', borderRadius: 2 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--ink-faint)', marginBottom: '0.15rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>From</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--ink)' }}>{trackingData.origin}</div>
                  </div>
                  <div style={{ flex: 1, position: 'relative', height: 2, background: 'var(--border)', borderRadius: 1 }}>
                    <div style={{ position: 'absolute', left: `${STATUS_MAP[trackingData.status].progress}%`, top: '50%', transform: 'translate(-50%, -50%)', fontSize: '1rem' }}>🚚</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--ink-faint)', marginBottom: '0.15rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>To</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--ink)' }}>{trackingData.destination}</div>
                  </div>
                </div>
              </div>

              {/* Progress steps */}
              <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '1.75rem' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '1.5rem' }}>Shipment Progress</div>
                <div style={{ display: 'flex', alignItems: 'flex-start', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 12, left: 12, right: 12, height: 2, background: 'var(--border)' }} />
                  <div style={{ position: 'absolute', top: 12, left: 12, height: 2, background: 'var(--red)', width: `${(stepIdx / (PROGRESS_STEPS.length - 1)) * (100 - (24 / 8))}%`, maxWidth: 'calc(100% - 24px)', transition: 'width 0.6s' }} />
                  {PROGRESS_STEPS.map((step, i) => (
                    <div key={step} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: i === 0 ? 'flex-start' : i === PROGRESS_STEPS.length - 1 ? 'flex-end' : 'center', position: 'relative', zIndex: 1 }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: i <= stepIdx ? 'var(--red)' : 'var(--white)', border: `2px solid ${i <= stepIdx ? 'var(--red)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem', transition: 'all 0.3s' }}>
                        {i < stepIdx && <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 5l2.5 2.5L8 3"/></svg>}
                        {i === stepIdx && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />}
                      </div>
                      <div style={{ fontSize: '0.62rem', color: i <= stepIdx ? 'var(--red)' : 'var(--ink-faint)', textAlign: 'center', maxWidth: 70, lineHeight: 1.3, fontWeight: i === stepIdx ? 500 : 300 }}>{step}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Event timeline */}
              <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '1.75rem' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '1.5rem' }}>Tracking History</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {trackingData.events.map((event, i) => (
                    <div key={i} style={{ display: 'flex', gap: '1.25rem', paddingBottom: i < trackingData.events.length - 1 ? '1.25rem' : 0, position: 'relative' }}>
                      {/* Connector line */}
                      {i < trackingData.events.length - 1 && (
                        <div style={{ position: 'absolute', left: 11, top: 24, bottom: 0, width: 1, background: 'var(--border)' }} />
                      )}
                      {/* Dot */}
                      <div style={{ width: 23, height: 23, borderRadius: '50%', background: event.active ? 'var(--red)' : 'var(--white)', border: `2px solid ${event.active ? 'var(--red)' : 'var(--border)'}`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                        {event.active && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />}
                      </div>
                      {/* Content */}
                      <div style={{ flex: 1, paddingBottom: '0.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.2rem', flexWrap: 'wrap', gap: '0.25rem' }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: event.active ? 500 : 400, color: event.active ? 'var(--ink)' : 'var(--ink-muted)' }}>{event.description}</div>
                          {event.active && <span style={{ fontSize: '0.62rem', fontWeight: 500, padding: '0.18rem 0.45rem', background: 'var(--red-light)', color: 'var(--red)', borderRadius: 1, border: '1px solid var(--red-mid)', textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>Current</span>}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--ink-faint)' }}>
                          {event.location} · {event.date} at {event.time}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Support nudge */}
              <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontFamily: 'var(--serif)', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.2rem', fontSize: '0.95rem' }}>Something wrong with your order?</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--ink-faint)', fontWeight: 300 }}>Our AI support responds in under 30 seconds.</div>
                </div>
                <a href="/support" style={{ padding: '0.6rem 1.25rem', background: 'var(--red)', color: 'var(--white)', borderRadius: 2, textDecoration: 'none', fontSize: '0.8rem', fontWeight: 500, fontFamily: 'var(--sans)', transition: 'background 0.2s', display: 'inline-block' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--red-deep)'} onMouseLeave={e => e.currentTarget.style.background = 'var(--red)'}>
                  Get help
                </a>
              </div>
            </div>
          )}

          {/* Empty state (no search yet) */}
          {!trackingData && !notFound && !loading && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '1rem' }}>
              {[
                { icon: '📍', title: 'Real-time location', desc: 'See exactly where your package is at every step' },
                { icon: '📲', title: 'SMS + email alerts', desc: 'Get notified automatically at every milestone' },
                { icon: '🌍', title: '200+ countries', desc: 'Track shipments across all major global carriers' },
              ].map((f) => (
                <div key={f.title} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '1.5rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{f.icon}</div>
                  <div style={{ fontFamily: 'var(--serif)', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.35rem', fontSize: '0.95rem' }}>{f.title}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--ink-faint)', fontWeight: 300, lineHeight: 1.5 }}>{f.desc}</div>
                </div>
              ))}
            </div>
          )}

          {/* Carrier logos */}
          <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '1rem' }}>Supported Carriers</div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              {CARRIERS.map(c => (
                <div key={c} style={{ padding: '0.4rem 0.9rem', background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 2, fontSize: '0.75rem', color: 'var(--ink-muted)', fontWeight: 300 }}>{c}</div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 640px) {
          div[style*="grid-template-columns: repeat(3, 1fr)"] { grid-template-columns: 1fr !important; }
          div[style*="display: flex"][style*="align-items: flex-start"] div[style*="flex: 1"][style*="display: flex"] { flex-direction: column; align-items: flex-start !important; }
        }
      `}</style>
    </>
  );
}