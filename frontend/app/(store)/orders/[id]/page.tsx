'use client';

import { useState } from 'react';
import Link from 'next/link';

// ── Mock order data ───────────────────────────────────────────
const ORDER = {
  id: 'ZY-28431',
  placedAt: 'Saturday, 28 June 2025 · 10:12 AM',
  status: 'IN_TRANSIT',
  paymentMethod: 'UPI — Google Pay',
  paymentId: 'pay_RzpABC123XYZ',
  gateway: 'Razorpay',
  subtotal: 178.00,
  shipping: 0,
  discount: 0,
  total: 178.00,
  estimatedDelivery: 'Thu, 3 Jul – Mon, 7 Jul 2025',
  shippingAddress: {
    name: 'Ryan K.',
    line1: '42 MG Road, Koramangala',
    line2: '',
    city: 'Bengaluru',
    state: 'Karnataka',
    pin: '560034',
    country: 'India',
    phone: '+91 98400 00000',
  },
  items: [
    { id: '1', name: 'Noise Cancelling Earbuds Pro', variant: 'Black / One Size', qty: 1, price: 79.00, image: '🎧' },
    { id: '2', name: 'Smart Wireless Crossbody — Midnight', variant: 'Midnight / Medium', qty: 1, price: 89.00, image: '👜' },
    { id: '3', name: 'Portable Power Bank 20K', variant: 'White', qty: 0, price: 10.00, image: '🔋' },
  ],
  tracking: {
    carrier: 'AliExpress Standard',
    number: 'LY123456789CN',
    url: '#',
    events: [
      { date: 'Jun 28 · 10:15 AM', status: 'Order placed',           location: 'Bengaluru, IN',  done: true  },
      { date: 'Jun 28 · 02:41 PM', status: 'Payment confirmed',      location: '',               done: true  },
      { date: 'Jun 29 · 08:30 AM', status: 'Submitted to supplier',  location: 'Guangzhou, CN',  done: true  },
      { date: 'Jun 30 · 11:00 AM', status: 'Shipped by supplier',    location: 'Guangzhou, CN',  done: true  },
      { date: 'Jul 01 · 06:00 AM', status: 'In transit',             location: 'Shanghai Hub',   done: true  },
      { date: 'Est. Jul 3–7',      status: 'Out for delivery',        location: 'Bengaluru, IN',  done: false },
      { date: '',                  status: 'Delivered',               location: '',               done: false },
    ],
  },
};

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:           { label: 'Pending',       color: '#6b7280', bg: '#f3f4f6' },
  PAYMENT_CONFIRMED: { label: 'Paid',          color: '#2563eb', bg: '#eff6ff' },
  SHIPPED:           { label: 'Shipped',       color: '#2563eb', bg: '#eff6ff' },
  IN_TRANSIT:        { label: 'In Transit',    color: '#d97706', bg: '#fef3c7' },
  DELIVERED:         { label: 'Delivered',     color: '#16a34a', bg: '#f0fdf4' },
  COMPLETED:         { label: 'Completed',     color: '#16a34a', bg: '#f0fdf4' },
  CANCELLED:         { label: 'Cancelled',     color: '#6b7280', bg: '#f3f4f6' },
  REFUND_REQUESTED:  { label: 'Refund Req.',   color: '#dc2626', bg: '#fef2f2' },
  REFUNDED:          { label: 'Refunded',      color: '#9f1239', bg: '#fff1f2' },
};

export default function StoreOrderDetailPage({ params }: { params: { id: string } }) {
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundMsg,  setRefundMsg]  = useState('');
  const s = STATUS_STYLE[ORDER.status] ?? STATUS_STYLE['PENDING'];
  const doneCount = ORDER.tracking.events.filter(e => e.done).length;
  const progressPct = Math.round((doneCount / ORDER.tracking.events.length) * 100);

  return (
    <div style={{ fontFamily: 'var(--sans)', background: 'var(--off-white)', minHeight: '100vh', color: 'var(--ink)' }}>

      {/* Nav */}
      <nav style={{ background: 'var(--white)', borderBottom: '1px solid var(--border)', padding: '0 2rem', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <div style={{ width: 28, height: 28, background: 'var(--red)', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'var(--serif)', fontWeight: 900, color: 'white', fontSize: '0.85rem' }}>Z</span>
          </div>
          <span style={{ fontFamily: 'var(--serif)', fontWeight: 900, fontSize: '1.1rem', color: 'var(--ink)', letterSpacing: '-0.02em' }}>Zylo<span style={{ color: 'var(--red)' }}>.</span></span>
        </Link>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', fontSize: '0.85rem' }}>
          <Link href="/orders" style={{ color: 'var(--ink-muted)', textDecoration: 'none', fontWeight: 300 }}>← My Orders</Link>
          <Link href="/track" style={{ color: 'var(--ink-muted)', textDecoration: 'none', fontWeight: 300 }}>Track package</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2.5rem 1.5rem', display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>

        {/* ── LEFT ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Header card */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '0.3rem' }}>Order</div>
                <h1 style={{ fontFamily: 'var(--serif)', fontSize: '1.6rem', fontWeight: 900, color: 'var(--ink)', letterSpacing: '-0.02em', lineHeight: 1 }}>#{ORDER.id}</h1>
                <div style={{ fontSize: '0.76rem', color: 'var(--ink-faint)', marginTop: '0.35rem' }}>{ORDER.placedAt}</div>
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '0.3rem 0.75rem', borderRadius: 2, background: s.bg, color: s.color, textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap', alignSelf: 'flex-start' }}>{s.label}</span>
            </div>

            {/* Progress bar */}
            <div style={{ marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--ink-faint)', marginBottom: '0.4rem' }}>
                <span>Order progress</span>
                <span>{doneCount}/{ORDER.tracking.events.length} steps</span>
              </div>
              <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progressPct}%`, background: 'var(--red)', borderRadius: 3, transition: 'width 0.8s cubic-bezier(0.22,1,0.36,1)' }} />
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--ink-faint)', marginTop: '0.4rem' }}>
                Estimated delivery: <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{ORDER.estimatedDelivery}</span>
              </div>
            </div>
          </div>

          {/* Tracking timeline */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>Tracking</div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: 'var(--ink-muted)' }}>{ORDER.tracking.number}</span>
                <a href={ORDER.tracking.url} style={{ fontSize: '0.72rem', color: 'var(--red)', textDecoration: 'none', borderBottom: '1px solid var(--red-mid)' }}>Track ↗</a>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {ORDER.tracking.events.map((ev, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '1rem', paddingBottom: i < ORDER.tracking.events.length - 1 ? '1.25rem' : 0 }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--ink-faint)', textAlign: 'right', paddingTop: '0.15rem', lineHeight: 1.4 }}>{ev.date}</div>
                  <div style={{ borderLeft: i < ORDER.tracking.events.length - 1 ? '1px solid var(--border)' : 'none', paddingLeft: '1.25rem', position: 'relative' }}>
                    <div style={{ position: 'absolute', left: -5, top: 4, width: 9, height: 9, borderRadius: '50%', background: ev.done ? 'var(--red)' : 'var(--border)', border: `2px solid ${ev.done ? 'var(--red-light)' : 'var(--off-white)'}`, transition: 'background 0.3s' }} />
                    <div style={{ fontWeight: ev.done ? 500 : 300, color: ev.done ? 'var(--ink)' : 'var(--ink-faint)', fontSize: '0.84rem' }}>{ev.status}</div>
                    {ev.location && <div style={{ fontSize: '0.72rem', color: 'var(--ink-faint)', marginTop: '0.1rem' }}>{ev.location}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Items */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '1.5rem' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '1.25rem' }}>Items ordered</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {ORDER.items.map((item, i) => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 0', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ width: 52, height: 52, background: 'var(--off-white)', border: '1px solid var(--border)', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>{item.image}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, color: 'var(--ink)', fontSize: '0.88rem' }}>{item.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--ink-faint)', marginTop: '0.15rem' }}>{item.variant} · Qty {item.qty}</div>
                  </div>
                  <div style={{ fontFamily: 'var(--serif)', fontWeight: 700, color: 'var(--red)', fontSize: '0.95rem' }}>${item.price.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Refund request */}
          {ORDER.status !== 'CANCELLED' && ORDER.status !== 'REFUNDED' && (
            <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '1.5rem' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '0.75rem' }}>Help & Returns</div>
              {!refundOpen ? (
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button onClick={() => setRefundOpen(true)} style={{ padding: '0.5rem 1rem', background: 'none', border: '1px solid var(--border)', borderRadius: 2, fontSize: '0.8rem', color: 'var(--ink-muted)', cursor: 'pointer', fontFamily: 'var(--sans)', transition: 'border-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--red)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                    Request refund
                  </button>
                  <Link href="/support" style={{ padding: '0.5rem 1rem', background: 'none', border: '1px solid var(--border)', borderRadius: 2, fontSize: '0.8rem', color: 'var(--ink-muted)', textDecoration: 'none', display: 'inline-block' }}>Contact support</Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <textarea value={refundMsg} onChange={e => setRefundMsg(e.target.value)} placeholder="Describe the issue with your order…" rows={3} style={{ border: '1px solid var(--border)', borderRadius: 2, padding: '0.65rem 0.75rem', fontSize: '0.82rem', fontFamily: 'var(--sans)', outline: 'none', resize: 'vertical' }} onFocus={e => e.currentTarget.style.borderColor = 'var(--red)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'} />
                  <div style={{ display: 'flex', gap: '0.6rem' }}>
                    <button style={{ padding: '0.5rem 1.1rem', background: 'var(--red)', color: 'white', border: 'none', borderRadius: 2, fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--sans)' }}>Submit request</button>
                    <button onClick={() => setRefundOpen(false)} style={{ padding: '0.5rem 0.85rem', background: 'none', border: '1px solid var(--border)', borderRadius: 2, fontSize: '0.8rem', color: 'var(--ink-muted)', cursor: 'pointer', fontFamily: 'var(--sans)' }}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Order summary */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '1.25rem' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '1rem' }}>Order summary</div>
            {[
              { label: 'Subtotal',  val: `$${ORDER.subtotal.toFixed(2)}` },
              { label: 'Shipping',  val: ORDER.shipping === 0 ? 'Free' : `$${ORDER.shipping.toFixed(2)}` },
              { label: 'Discount',  val: ORDER.discount === 0 ? '—' : `-$${ORDER.discount.toFixed(2)}` },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.55rem' }}>
                <span style={{ color: 'var(--ink-faint)' }}>{row.label}</span>
                <span style={{ color: 'var(--ink-muted)' }}>{row.val}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: '0.25rem', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600, color: 'var(--ink)', fontSize: '0.9rem' }}>Total</span>
              <span style={{ fontFamily: 'var(--serif)', fontWeight: 900, color: 'var(--red)', fontSize: '1.1rem' }}>${ORDER.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '1.25rem' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '1rem' }}>Payment</div>
            <div style={{ fontSize: '0.84rem', fontWeight: 500, color: 'var(--ink)', marginBottom: '0.25rem' }}>{ORDER.paymentMethod}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--ink-faint)' }}>via {ORDER.gateway}</div>
            <div style={{ fontSize: '0.68rem', fontFamily: 'monospace', color: 'var(--ink-faint)', marginTop: '0.4rem', wordBreak: 'break-all' }}>{ORDER.paymentId}</div>
          </div>

          {/* Shipping address */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '1.25rem' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '1rem' }}>Shipping to</div>
            <div style={{ fontSize: '0.84rem', fontWeight: 500, color: 'var(--ink)', marginBottom: '0.2rem' }}>{ORDER.shippingAddress.name}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', lineHeight: 1.65, fontWeight: 300 }}>
              {ORDER.shippingAddress.line1}<br />
              {ORDER.shippingAddress.city}, {ORDER.shippingAddress.state} — {ORDER.shippingAddress.pin}<br />
              {ORDER.shippingAddress.country}<br />
              {ORDER.shippingAddress.phone}
            </div>
          </div>

          {/* Download invoice */}
          <button style={{ width: '100%', padding: '0.65rem', background: 'var(--off-white)', border: '1px solid var(--border)', borderRadius: 2, fontSize: '0.82rem', color: 'var(--ink-muted)', cursor: 'pointer', fontFamily: 'var(--sans)', fontWeight: 400, transition: 'border-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--red)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
            ↓ Download invoice
          </button>
        </div>
      </div>

      <style>{`
        @media (max-width: 760px) {
          div[style*="grid-template-columns: 1fr 340px"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}