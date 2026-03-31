'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import UserAuthGuard from '@/components/auth/UserAuthGuard';
import { getOrders, OrderSummary } from '@/lib/api/orders';

type FilterStatus = 'all' | string;

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  IN_TRANSIT:            { label: 'In Transit',       color: '#d97706', bg: '#fef3c7', icon: '🚚' },
  SHIPPED:               { label: 'Shipped',           color: '#2563eb', bg: '#eff6ff', icon: '📬' },
  DELIVERED:             { label: 'Delivered',         color: '#16a34a', bg: '#f0fdf4', icon: '✅' },
  COMPLETED:             { label: 'Completed',         color: '#16a34a', bg: '#f0fdf4', icon: '✅' },
  PENDING:               { label: 'Pending',           color: '#6b7280', bg: '#f3f4f6', icon: '⏳' },
  PAYMENT_CONFIRMED:     { label: 'Confirmed',         color: '#7c3aed', bg: '#f5f3ff', icon: '✓'  },
  SUBMITTED_TO_SUPPLIER: { label: 'Processing',        color: '#d97706', bg: '#fef3c7', icon: '⚙️' },
  CANCELLED:             { label: 'Cancelled',         color: '#6b7280', bg: '#f3f4f6', icon: '✕'  },
  REFUND_REQUESTED:      { label: 'Refund Requested',  color: '#7c3aed', bg: '#f5f3ff', icon: '↩'  },
  REFUNDED:              { label: 'Refunded',          color: '#9f1239', bg: '#fff1f2', icon: '↩'  },
  OUT_FOR_DELIVERY:      { label: 'Out for Delivery',  color: '#16a34a', bg: '#f0fdf4', icon: '🚚' },
};

const TIMELINE_STEPS = ['Order placed', 'Payment confirmed', 'Processing', 'Shipped', 'Out for delivery', 'Delivered'];

function getTimelineStep(status: string) {
  switch (status) {
    case 'PAYMENT_CONFIRMED':     return 1;
    case 'SUBMITTED_TO_SUPPLIER':
    case 'SUPPLIER_CONFIRMED':    return 2;
    case 'SHIPPED':               return 3;
    case 'IN_TRANSIT':            return 3;
    case 'OUT_FOR_DELIVERY':      return 4;
    case 'DELIVERED':
    case 'COMPLETED':             return 5;
    default:                      return 0;
  }
}

function OrderCard({ order }: { order: OrderSummary }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG['PENDING'];
  const timelineStep = getTimelineStep(order.status);
  const isCancelled = order.status === 'CANCELLED' || order.status === 'REFUNDED';

  return (
    <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, overflow: 'hidden' }}>
      <div
        style={{ padding: '1.25rem 1.5rem', display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'start', cursor: 'pointer' }}
        onClick={() => setExpanded(v => !v)}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--ink)' }}>#{order.orderNumber}</span>
            <span style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '0.2rem 0.55rem', borderRadius: 1, background: cfg.bg, color: cfg.color }}>
              {cfg.icon} {cfg.label}
            </span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--ink-faint)', marginBottom: '0.4rem' }}>
            Placed {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--ink-muted)', fontWeight: 300 }}>
            {order.items?.[0]?.product?.title}
            {(order.items?.length ?? 0) > 1 ? ` + ${order.items.length - 1} more` : ''}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--red)', marginBottom: '0.25rem' }}>${order.totalAmount.toFixed(2)}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--ink-faint)', transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'rotate(0)' }}>▾</div>
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '1.5rem' }}>

          {/* Timeline */}
          {!isCancelled && (
            <div style={{ marginBottom: '1.75rem' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '1rem' }}>Order Progress</div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <div style={{ position: 'absolute', top: 12, left: 12, right: 12, height: 2, background: 'var(--border)', zIndex: 0 }} />
                <div style={{ position: 'absolute', top: 12, left: 12, width: `${(timelineStep / (TIMELINE_STEPS.length - 1)) * 100}%`, height: 2, background: 'var(--red)', zIndex: 1, transition: 'width 0.5s', maxWidth: 'calc(100% - 24px)' }} />
                {TIMELINE_STEPS.map((step, i) => (
                  <div key={step} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: i === 0 ? 'flex-start' : i === TIMELINE_STEPS.length - 1 ? 'flex-end' : 'center', position: 'relative', zIndex: 2 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: i <= timelineStep ? 'var(--red)' : 'var(--white)', border: `2px solid ${i <= timelineStep ? 'var(--red)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s', marginBottom: '0.4rem' }}>
                      {i < timelineStep && <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 5l2.5 2.5L8 3"/></svg>}
                      {i === timelineStep && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />}
                    </div>
                    <div style={{ fontSize: '0.62rem', color: i <= timelineStep ? 'var(--red)' : 'var(--ink-faint)', textAlign: 'center', maxWidth: 60, lineHeight: 1.3, fontWeight: i === timelineStep ? 500 : 300 }}>{step}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Items */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '0.75rem' }}>Items</div>
            {order.items?.map(item => (
              <div key={item.id ?? item.product?.title} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.83rem' }}>
                <span style={{ color: 'var(--ink-muted)', fontWeight: 300 }}>{item.product?.title} × {item.quantity}</span>
                <span style={{ color: 'var(--ink)', fontWeight: 500 }}>${((item.price ?? 0) * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.75rem', fontWeight: 700 }}>
              <span style={{ fontFamily: 'var(--serif)', color: 'var(--ink)', fontSize: '0.9rem' }}>Total</span>
              <span style={{ fontFamily: 'var(--serif)', color: 'var(--red)', fontSize: '1rem' }}>${order.totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <Link href={`/orders/${order.id}`} style={{ padding: '0.6rem 1rem', background: 'var(--red)', color: 'var(--white)', border: 'none', borderRadius: 2, fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--sans)', textDecoration: 'none', display: 'inline-block' }}>
              View details
            </Link>
            {(order.status === 'DELIVERED' || order.status === 'COMPLETED') && (
              <Link href={`/orders/${order.id}`} style={{ padding: '0.6rem 1rem', background: 'none', color: 'var(--ink-muted)', border: '1px solid var(--border)', borderRadius: 2, fontSize: '0.78rem', fontFamily: 'var(--sans)', textDecoration: 'none', display: 'inline-block' }}>
                Request return
              </Link>
            )}
            <Link href={`/support?order=${order.orderNumber}`} style={{ padding: '0.6rem 1rem', background: 'none', color: 'var(--ink-muted)', border: '1px solid var(--border)', borderRadius: 2, fontSize: '0.78rem', fontFamily: 'var(--sans)', textDecoration: 'none', display: 'inline-block' }}>
              Get help
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function OrdersContent() {
  const router = useRouter();
  const [orders, setOrders]   = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState<FilterStatus>('all');
  const [total, setTotal]     = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const res = await getOrders({ page: 1, limit: 50 });
        setOrders(res.orders);
        setTotal(res.pagination.total);
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const FILTER_OPTIONS = ['all', 'IN_TRANSIT', 'SHIPPED', 'DELIVERED', 'PROCESSING', 'CANCELLED'];
  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter || (filter === 'PROCESSING' && (o.status === 'SUBMITTED_TO_SUPPLIER' || o.status === 'SUPPLIER_CONFIRMED' || o.status === 'PAYMENT_CONFIRMED')));

  return (
    <>
      <Header />
      <main style={{ paddingTop: '5rem', background: 'var(--off-white)', minHeight: '100vh' }}>
        <div style={{ padding: '2rem 4vw 1.5rem', background: 'var(--white)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--red)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ display: 'inline-block', width: 16, height: 1, background: 'var(--red)' }} />
            My Orders
          </div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--ink)' }}>Order History</h1>
        </div>

        <div style={{ padding: '2.5rem 4vw 5rem', maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
            {FILTER_OPTIONS.map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ padding: '0.4rem 1rem', borderRadius: 20, border: `1.5px solid ${filter === f ? 'var(--red)' : 'var(--border)'}`, background: filter === f ? 'var(--red)' : 'transparent', color: filter === f ? 'var(--white)' : 'var(--ink-muted)', fontSize: '0.78rem', fontWeight: filter === f ? 500 : 300, cursor: 'pointer', fontFamily: 'var(--sans)', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.18s' }}>
                {f === 'all' ? `All orders (${total})` : STATUS_CONFIG[f]?.label ?? f}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[1,2,3].map(i => (
                <div key={i} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '1.5rem', height: 90, animation: 'pulse 1.5s ease-in-out infinite' }} />
              ))}
              <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--white)', borderRadius: 4, border: '1px solid var(--border)' }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: '1.4rem', color: 'var(--ink-faint)', marginBottom: '0.5rem' }}>No orders found</div>
              <p style={{ fontSize: '0.88rem', color: 'var(--ink-faint)', marginBottom: '1.5rem' }}>
                {filter === 'all' ? "You haven't placed any orders yet." : `No ${STATUS_CONFIG[filter]?.label?.toLowerCase() ?? filter} orders.`}
              </p>
              <Link href="/products" style={{ padding: '0.65rem 1.4rem', background: 'var(--red)', color: 'var(--white)', borderRadius: 2, textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500 }}>Start shopping</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filtered.map(order => <OrderCard key={order.id} order={order} />)}
            </div>
          )}

          <div style={{ marginTop: '2.5rem', padding: '1.5rem', background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontFamily: 'var(--serif)', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.2rem' }}>Need help with an order?</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--ink-muted)', fontWeight: 300 }}>Our AI support agent responds in under 30 seconds.</div>
            </div>
            <Link href="/support" style={{ padding: '0.65rem 1.4rem', background: 'var(--red)', color: 'var(--white)', borderRadius: 2, textDecoration: 'none', fontSize: '0.82rem', fontWeight: 500, fontFamily: 'var(--sans)', display: 'inline-block' }}>
              Contact support
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function OrdersPage() {
  return (
    <UserAuthGuard>
      <OrdersContent />
    </UserAuthGuard>
  );
}