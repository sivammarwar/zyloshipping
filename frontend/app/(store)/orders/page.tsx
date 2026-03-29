'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

// ── Types ─────────────────────────────────────────────────────
type OrderStatus = 'DELIVERED' | 'IN_TRANSIT' | 'PROCESSING' | 'CANCELLED' | 'REFUND_REQUESTED';

interface OrderItem {
  name: string;
  qty: number;
  price: number;
}

interface Order {
  id: string;
  date: string;
  status: OrderStatus;
  total: number;
  items: OrderItem[];
  tracking?: string;
  estimatedDelivery?: string;
  carrier?: string;
}

// ── Mock data ─────────────────────────────────────────────────
const MOCK_ORDERS: Order[] = [
  {
    id: 'ZY-28431',
    date: 'March 24, 2026',
    status: 'IN_TRANSIT',
    total: 199,
    items: [
      { name: 'Smart Wireless Crossbody — Midnight Edition', qty: 1, price: 89 },
      { name: 'Portable Power Bank 20K', qty: 2, price: 55 },
    ],
    tracking: '1Z999AA10123456784',
    estimatedDelivery: 'March 30, 2026',
    carrier: 'UPS',
  },
  {
    id: 'ZY-27890',
    date: 'March 10, 2026',
    status: 'DELIVERED',
    total: 69,
    items: [{ name: 'Breathable Sports Watch', qty: 1, price: 69 }],
    tracking: '9261290100830900000132',
    carrier: 'USPS',
  },
  {
    id: 'ZY-26112',
    date: 'February 28, 2026',
    status: 'DELIVERED',
    total: 32,
    items: [{ name: 'Foldable Travel Yoga Mat', qty: 1, price: 32 }],
    tracking: '794644792798',
    carrier: 'FedEx',
  },
  {
    id: 'ZY-25041',
    date: 'February 12, 2026',
    status: 'CANCELLED',
    total: 44,
    items: [{ name: 'Ceramic Pour-Over Coffee Kit', qty: 1, price: 44 }],
  },
];

// ── Status config ─────────────────────────────────────────────
const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string; icon: string }> = {
  IN_TRANSIT:       { label: 'In Transit',        color: '#d97706', bg: '#fef3c7', icon: '🚚' },
  DELIVERED:        { label: 'Delivered',          color: '#16a34a', bg: '#f0fdf4', icon: '✅' },
  PROCESSING:       { label: 'Processing',         color: 'var(--red)', bg: 'var(--red-light)', icon: '⚙️' },
  CANCELLED:        { label: 'Cancelled',          color: '#6b7280', bg: '#f3f4f6', icon: '✕' },
  REFUND_REQUESTED: { label: 'Refund Requested',   color: '#7c3aed', bg: '#f5f3ff', icon: '↩' },
};

// ── Timeline steps ────────────────────────────────────────────
const TIMELINE_STEPS = ['Order placed', 'Payment confirmed', 'Processing', 'Shipped', 'Out for delivery', 'Delivered'];
function getTimelineStep(status: OrderStatus) {
  switch (status) {
    case 'PROCESSING':       return 2;
    case 'IN_TRANSIT':       return 3;
    case 'DELIVERED':        return 5;
    default:                 return 0;
  }
}

// ── Order card ────────────────────────────────────────────────
function OrderCard({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[order.status];
  const timelineStep = getTimelineStep(order.status);
  const isCancelled = order.status === 'CANCELLED';

  return (
    <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, overflow: 'hidden', transition: 'box-shadow 0.2s' }}>
      {/* Card header */}
      <div
        style={{ padding: '1.25rem 1.5rem', display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'start', cursor: 'pointer' }}
        onClick={() => setExpanded((v) => !v)}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--ink)' }}>
              #{order.id}
            </span>
            <span style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '0.2rem 0.55rem', borderRadius: 1, background: cfg.bg, color: cfg.color }}>
              {cfg.icon} {cfg.label}
            </span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--ink-faint)', marginBottom: '0.4rem' }}>Placed {order.date}</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--ink-muted)', fontWeight: 300 }}>
            {order.items.map((item) => `${item.name} × ${item.qty}`).join(' · ')}
          </div>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--red)', marginBottom: '0.25rem' }}>
            ${order.total.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--ink-faint)', transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'rotate(0)' }}>
            ▾
          </div>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '1.5rem' }}>

          {/* Timeline */}
          {!isCancelled && (
            <div style={{ marginBottom: '1.75rem' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '1rem' }}>
                Order Progress
              </div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 0 }}>
                {/* Track bar */}
                <div style={{ position: 'absolute', top: 12, left: 12, right: 12, height: 2, background: 'var(--border)', zIndex: 0 }} />
                <div style={{ position: 'absolute', top: 12, left: 12, width: `${(timelineStep / (TIMELINE_STEPS.length - 1)) * 100}%`, height: 2, background: 'var(--red)', zIndex: 1, transition: 'width 0.5s', maxWidth: 'calc(100% - 24px)' }} />

                {TIMELINE_STEPS.map((step, i) => (
                  <div key={step} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: i === 0 ? 'flex-start' : i === TIMELINE_STEPS.length - 1 ? 'flex-end' : 'center', position: 'relative', zIndex: 2 }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: i <= timelineStep ? 'var(--red)' : 'var(--white)',
                      border: `2px solid ${i <= timelineStep ? 'var(--red)' : 'var(--border)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.3s',
                      marginBottom: '0.4rem',
                    }}>
                      {i < timelineStep && <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 5l2.5 2.5L8 3" /></svg>}
                      {i === timelineStep && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />}
                    </div>
                    <div style={{ fontSize: '0.62rem', color: i <= timelineStep ? 'var(--red)' : 'var(--ink-faint)', textAlign: 'center', maxWidth: 60, lineHeight: 1.3, fontWeight: i === timelineStep ? 500 : 300 }}>
                      {step}
                    </div>
                  </div>
                ))}
              </div>
              {order.estimatedDelivery && (
                <div style={{ marginTop: '1rem', fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
                  Estimated delivery: <strong style={{ color: 'var(--ink)' }}>{order.estimatedDelivery}</strong>
                </div>
              )}
            </div>
          )}

          {/* Items breakdown */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '0.75rem' }}>Items</div>
            {order.items.map((item) => (
              <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.83rem' }}>
                <span style={{ color: 'var(--ink-muted)', fontWeight: 300 }}>{item.name} × {item.qty}</span>
                <span style={{ color: 'var(--ink)', fontWeight: 500 }}>${(item.price * item.qty).toFixed(2)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.75rem', fontWeight: 700 }}>
              <span style={{ fontFamily: 'var(--serif)', color: 'var(--ink)', fontSize: '0.9rem' }}>Total</span>
              <span style={{ fontFamily: 'var(--serif)', color: 'var(--red)', fontSize: '1rem' }}>${order.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Tracking + actions */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {order.tracking && (
              <div style={{ flex: 1, minWidth: 200, background: 'var(--off-white)', border: '1px solid var(--border)', borderRadius: 2, padding: '0.75rem 1rem', fontSize: '0.78rem' }}>
                <div style={{ color: 'var(--ink-faint)', marginBottom: '0.2rem' }}>Tracking ({order.carrier})</div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--ink)', letterSpacing: '0.05em' }}>{order.tracking}</div>
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {order.tracking && (
                <Link href={`/track?order=${order.id}`} style={{ padding: '0.6rem 1rem', background: 'var(--red)', color: 'var(--white)', border: 'none', borderRadius: 2, fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--sans)', textDecoration: 'none', display: 'inline-block', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--red-deep)'} onMouseLeave={e => e.currentTarget.style.background = 'var(--red)'}>
                  Track shipment
                </Link>
              )}
              {order.status === 'DELIVERED' && (
                <button style={{ padding: '0.6rem 1rem', background: 'none', color: 'var(--ink-muted)', border: '1px solid var(--border)', borderRadius: 2, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'var(--sans)', transition: 'border-color 0.2s, color 0.2s' }} onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--red)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--red)'; }} onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--ink-muted)'; }}>
                  Request return
                </button>
              )}
              <Link href={`/support?order=${order.id}`} style={{ padding: '0.6rem 1rem', background: 'none', color: 'var(--ink-muted)', border: '1px solid var(--border)', borderRadius: 2, fontSize: '0.78rem', fontFamily: 'var(--sans)', textDecoration: 'none', display: 'inline-block', transition: 'border-color 0.2s, color 0.2s' }} onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--red)'; e.currentTarget.style.color = 'var(--red)'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--ink-muted)'; }}>
                Get help
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────
export default function OrdersPage() {
  const [filter, setFilter] = useState<'all' | OrderStatus>('all');

  const filtered = filter === 'all' ? MOCK_ORDERS : MOCK_ORDERS.filter((o) => o.status === filter);

  return (
    <>
      <Header />

      <main style={{ paddingTop: '5rem', background: 'var(--off-white)', minHeight: '100vh' }}>
        {/* Page header */}
        <div style={{ padding: '2rem 4vw 1.5rem', background: 'var(--white)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--red)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ display: 'inline-block', width: 16, height: 1, background: 'var(--red)' }} />
            My Orders
          </div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--ink)' }}>
            Order History
          </h1>
        </div>

        <div style={{ padding: '2.5rem 4vw 5rem', maxWidth: 900, margin: '0 auto' }}>

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
            {(['all', 'IN_TRANSIT', 'DELIVERED', 'PROCESSING', 'CANCELLED'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '0.4rem 1rem',
                  borderRadius: 20,
                  border: `1.5px solid ${filter === f ? 'var(--red)' : 'var(--border)'}`,
                  background: filter === f ? 'var(--red)' : 'transparent',
                  color: filter === f ? 'var(--white)' : 'var(--ink-muted)',
                  fontSize: '0.78rem',
                  fontWeight: filter === f ? 500 : 300,
                  cursor: 'pointer',
                  fontFamily: 'var(--sans)',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  transition: 'all 0.18s',
                }}
              >
                {f === 'all' ? 'All orders' : STATUS_CONFIG[f as OrderStatus].label}
              </button>
            ))}
          </div>

          {/* Orders list */}
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--white)', borderRadius: 4, border: '1px solid var(--border)' }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: '1.4rem', color: 'var(--ink-faint)', marginBottom: '0.5rem' }}>No orders found</div>
              <p style={{ fontSize: '0.88rem', color: 'var(--ink-faint)', marginBottom: '1.5rem' }}>
                {filter === 'all' ? "You haven't placed any orders yet." : `No ${STATUS_CONFIG[filter as OrderStatus].label.toLowerCase()} orders.`}
              </p>
              <Link href="/products" className="btn-primary">Start shopping</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filtered.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}

          {/* Help row */}
          <div style={{ marginTop: '2.5rem', padding: '1.5rem', background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontFamily: 'var(--serif)', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.2rem' }}>Need help with an order?</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--ink-muted)', fontWeight: 300 }}>Our AI support agent responds in under 30 seconds.</div>
            </div>
            <Link href="/support" style={{ padding: '0.65rem 1.4rem', background: 'var(--red)', color: 'var(--white)', borderRadius: 2, textDecoration: 'none', fontSize: '0.82rem', fontWeight: 500, fontFamily: 'var(--sans)', transition: 'background 0.2s', display: 'inline-block' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--red-deep)'} onMouseLeave={e => e.currentTarget.style.background = 'var(--red)'}>
              Contact support
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}