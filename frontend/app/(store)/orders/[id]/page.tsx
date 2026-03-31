'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import UserAuthGuard from '@/components/auth/UserAuthGuard';
import { ensureValidToken } from '@/lib/tokenManager';

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:               { label: 'Pending',       color: '#6b7280', bg: '#f3f4f6' },
  PAYMENT_CONFIRMED:     { label: 'Paid',           color: '#2563eb', bg: '#eff6ff' },
  SUBMITTED_TO_SUPPLIER: { label: 'Processing',     color: '#d97706', bg: '#fef3c7' },
  SUPPLIER_CONFIRMED:    { label: 'Confirmed',      color: '#7c3aed', bg: '#f5f3ff' },
  SHIPPED:               { label: 'Shipped',        color: '#2563eb', bg: '#eff6ff' },
  IN_TRANSIT:            { label: 'In Transit',     color: '#d97706', bg: '#fef3c7' },
  OUT_FOR_DELIVERY:      { label: 'Out for Delivery', color: '#16a34a', bg: '#f0fdf4' },
  DELIVERED:             { label: 'Delivered',      color: '#16a34a', bg: '#f0fdf4' },
  COMPLETED:             { label: 'Completed',      color: '#16a34a', bg: '#f0fdf4' },
  CANCELLED:             { label: 'Cancelled',      color: '#6b7280', bg: '#f3f4f6' },
  REFUND_REQUESTED:      { label: 'Refund Req.',    color: '#dc2626', bg: '#fef2f2' },
  REFUNDED:              { label: 'Refunded',       color: '#9f1239', bg: '#fff1f2' },
};

const TIMELINE_STEPS = [
  'PENDING',
  'PAYMENT_CONFIRMED',
  'SUBMITTED_TO_SUPPLIER',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
];

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  totalAmount: number;
  subtotal?: number;
  shippingCost?: number;
  discount?: number;
  estimatedDelivery?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  carrier?: string;
  paymentMethod?: string;
  paymentId?: string;
  gateway?: string;
  shippingAddress?: {
    firstName: string; lastName: string;
    line1: string; line2?: string;
    city: string; state: string; zip: string;
    country: string; phone?: string;
  };
  items: {
    id: string;
    quantity: number;
    price: number;
    product: { title: string; images?: string[] };
  }[];
  trackingEvents?: {
    date: string;
    status: string;
    location?: string;
    done: boolean;
  }[];
}

function OrderDetailContent({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [order, setOrder]       = useState<OrderDetail | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundMsg, setRefundMsg]   = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      const token = await ensureValidToken();
      if (!token) { router.replace('/login?redirect=/orders'); return; }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/orders/${orderId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.status === 401) { router.replace('/login?redirect=/orders'); return; }
      if (!res.ok) { setError('Order not found.'); return; }
      const data = await res.json();
      setOrder(data.order ?? data);
    } catch {
      setError('Failed to load order. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [orderId, router]);

  useEffect(() => {
    fetchOrder();
    // Poll every 30 s for live status updates
    const interval = setInterval(fetchOrder, 30000);
    return () => clearInterval(interval);
  }, [fetchOrder]);

  async function handleRefundSubmit() {
    if (!refundMsg.trim()) return;
    setSubmitting(true);
    try {
      const token = await ensureValidToken();
      await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/orders/${orderId}/refund`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ reason: refundMsg }),
        }
      );
      setRefundOpen(false);
      setRefundMsg('');
      fetchOrder();
    } catch {
      // silent
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 28, height: 28, border: '2px solid var(--red)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
        <p style={{ color: 'var(--ink-muted)', fontSize: '0.9rem' }}>{error || 'Order not found.'}</p>
        <Link href="/orders" style={{ color: 'var(--red)', fontSize: '0.85rem' }}>← Back to orders</Link>
      </div>
    );
  }

  const s = STATUS_STYLE[order.status] ?? STATUS_STYLE['PENDING'];
  const currentStep = TIMELINE_STEPS.indexOf(order.status);
  const events = order.trackingEvents ?? TIMELINE_STEPS.map((step, i) => ({
    status: STATUS_STYLE[step]?.label ?? step,
    date: '',
    done: i <= (currentStep === -1 ? 0 : currentStep),
    location: '',
  }));
  const doneCount = events.filter(e => e.done).length;
  const progressPct = Math.round((doneCount / events.length) * 100);

  const subtotal = order.subtotal ?? order.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping = order.shippingCost ?? 0;
  const discount = order.discount ?? 0;

  return (
    <div style={{ fontFamily: 'var(--sans)', background: 'var(--off-white)', minHeight: '100vh', color: 'var(--ink)' }}>
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

        {/* LEFT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Header */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '0.3rem' }}>Order</div>
                <h1 style={{ fontFamily: 'var(--serif)', fontSize: '1.6rem', fontWeight: 900, color: 'var(--ink)', letterSpacing: '-0.02em', lineHeight: 1 }}>#{order.orderNumber}</h1>
                <div style={{ fontSize: '0.76rem', color: 'var(--ink-faint)', marginTop: '0.35rem' }}>
                  {new Date(order.createdAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '0.3rem 0.75rem', borderRadius: 2, background: s.bg, color: s.color, textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap', alignSelf: 'flex-start' }}>{s.label}</span>
            </div>
            <div style={{ marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--ink-faint)', marginBottom: '0.4rem' }}>
                <span>Order progress</span><span>{doneCount}/{events.length} steps</span>
              </div>
              <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progressPct}%`, background: 'var(--red)', borderRadius: 3, transition: 'width 0.8s cubic-bezier(0.22,1,0.36,1)' }} />
              </div>
              {order.estimatedDelivery && (
                <div style={{ fontSize: '0.72rem', color: 'var(--ink-faint)', marginTop: '0.4rem' }}>
                  Estimated delivery: <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{order.estimatedDelivery}</span>
                </div>
              )}
            </div>
          </div>

          {/* Tracking */}
          {(order.trackingNumber || events.length > 0) && (
            <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>Tracking</div>
                {order.trackingNumber && (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: 'var(--ink-muted)' }}>{order.trackingNumber}</span>
                    {order.trackingUrl && (
                      <a href={order.trackingUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.72rem', color: 'var(--red)', textDecoration: 'none', borderBottom: '1px solid var(--red-mid)' }}>Track ↗</a>
                    )}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {events.map((ev, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '1rem', paddingBottom: i < events.length - 1 ? '1.25rem' : 0 }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--ink-faint)', textAlign: 'right', paddingTop: '0.15rem', lineHeight: 1.4 }}>{ev.date}</div>
                    <div style={{ borderLeft: i < events.length - 1 ? '1px solid var(--border)' : 'none', paddingLeft: '1.25rem', position: 'relative' }}>
                      <div style={{ position: 'absolute', left: -5, top: 4, width: 9, height: 9, borderRadius: '50%', background: ev.done ? 'var(--red)' : 'var(--border)', border: `2px solid ${ev.done ? 'var(--red-light)' : 'var(--off-white)'}`, transition: 'background 0.3s' }} />
                      <div style={{ fontWeight: ev.done ? 500 : 300, color: ev.done ? 'var(--ink)' : 'var(--ink-faint)', fontSize: '0.84rem' }}>{ev.status}</div>
                      {ev.location && <div style={{ fontSize: '0.72rem', color: 'var(--ink-faint)', marginTop: '0.1rem' }}>{ev.location}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Items */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '1.5rem' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '1.25rem' }}>Items ordered</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {order.items.map((item, i) => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 0', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ width: 52, height: 52, background: 'var(--off-white)', border: '1px solid var(--border)', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0, overflow: 'hidden' }}>
                    {item.product.images?.[0]
                      ? <img src={item.product.images[0]} alt={item.product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : '📦'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, color: 'var(--ink)', fontSize: '0.88rem' }}>{item.product.title}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--ink-faint)', marginTop: '0.15rem' }}>Qty {item.quantity}</div>
                  </div>
                  <div style={{ fontFamily: 'var(--serif)', fontWeight: 700, color: 'var(--red)', fontSize: '0.95rem' }}>${(item.price * item.quantity).toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Refund */}
          {order.status !== 'CANCELLED' && order.status !== 'REFUNDED' && order.status !== 'REFUND_REQUESTED' && (
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
                    <button onClick={handleRefundSubmit} disabled={submitting || !refundMsg.trim()} style={{ padding: '0.5rem 1.1rem', background: 'var(--red)', color: 'white', border: 'none', borderRadius: 2, fontSize: '0.8rem', fontWeight: 500, cursor: submitting ? 'default' : 'pointer', fontFamily: 'var(--sans)', opacity: submitting ? 0.7 : 1 }}>
                      {submitting ? 'Submitting…' : 'Submit request'}
                    </button>
                    <button onClick={() => setRefundOpen(false)} style={{ padding: '0.5rem 0.85rem', background: 'none', border: '1px solid var(--border)', borderRadius: 2, fontSize: '0.8rem', color: 'var(--ink-muted)', cursor: 'pointer', fontFamily: 'var(--sans)' }}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '1.25rem' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '1rem' }}>Order summary</div>
            {[
              { label: 'Subtotal',  val: `$${subtotal.toFixed(2)}` },
              { label: 'Shipping',  val: shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}` },
              { label: 'Discount',  val: discount === 0 ? '—' : `-$${discount.toFixed(2)}` },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.55rem' }}>
                <span style={{ color: 'var(--ink-faint)' }}>{row.label}</span>
                <span style={{ color: 'var(--ink-muted)' }}>{row.val}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: '0.25rem', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600, color: 'var(--ink)', fontSize: '0.9rem' }}>Total</span>
              <span style={{ fontFamily: 'var(--serif)', fontWeight: 900, color: 'var(--red)', fontSize: '1.1rem' }}>${order.totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {(order.paymentMethod || order.gateway) && (
            <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '1.25rem' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '1rem' }}>Payment</div>
              {order.paymentMethod && <div style={{ fontSize: '0.84rem', fontWeight: 500, color: 'var(--ink)', marginBottom: '0.25rem' }}>{order.paymentMethod}</div>}
              {order.gateway && <div style={{ fontSize: '0.72rem', color: 'var(--ink-faint)' }}>via {order.gateway}</div>}
              {order.paymentId && <div style={{ fontSize: '0.68rem', fontFamily: 'monospace', color: 'var(--ink-faint)', marginTop: '0.4rem', wordBreak: 'break-all' }}>{order.paymentId}</div>}
            </div>
          )}

          {order.shippingAddress && (
            <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '1.25rem' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '1rem' }}>Shipping to</div>
              <div style={{ fontSize: '0.84rem', fontWeight: 500, color: 'var(--ink)', marginBottom: '0.2rem' }}>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', lineHeight: 1.65, fontWeight: 300 }}>
                {order.shippingAddress.line1}{order.shippingAddress.line2 && `, ${order.shippingAddress.line2}`}<br />
                {order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.zip}<br />
                {order.shippingAddress.country}
                {order.shippingAddress.phone && <><br />{order.shippingAddress.phone}</>}
              </div>
            </div>
          )}
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

export default function StoreOrderDetailPage({ params }: { params: { id: string } }) {
  return (
    <UserAuthGuard>
      <OrderDetailContent orderId={params.id} />
    </UserAuthGuard>
  );
}