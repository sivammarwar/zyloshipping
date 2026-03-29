'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

// In production these come from URL params / session after Razorpay/Stripe callback
const MOCK_CONFIRMATION = {
  orderId:       'ZY-28431',
  paymentId:     'pay_RzpABC123XYZ',
  paymentMethod: 'UPI — Google Pay',
  total:         178.00,
  estimatedDelivery: 'Thu, 3 Jul – Mon, 7 Jul 2025',
  email:         'ryan@email.com',
  items: [
    { name: 'Noise Cancelling Earbuds Pro', qty: 1, price: 79.00, image: '🎧' },
    { name: 'Smart Wireless Crossbody — Midnight', qty: 1, price: 89.00, image: '👜' },
    { name: 'Portable Power Bank 20K', qty: 0, price: 10.00, image: '🔋' },
  ],
};

function SuccessCheckmark() {
  const [drawn, setDrawn] = useState(false);
  useEffect(() => { const t = setTimeout(() => setDrawn(true), 100); return () => clearTimeout(t); }, []);
  return (
    <div style={{ position: 'relative', width: 72, height: 72, margin: '0 auto 1.5rem' }}>
      <svg viewBox="0 0 72 72" width="72" height="72" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="36" cy="36" r="32" fill="none" stroke="var(--border)" strokeWidth="3" />
        <circle cx="36" cy="36" r="32" fill="none" stroke="var(--red)" strokeWidth="3"
          strokeDasharray={`${2 * Math.PI * 32}`}
          strokeDashoffset={drawn ? 0 : `${2 * Math.PI * 32}`}
          style={{ transition: 'stroke-dashoffset 0.7s cubic-bezier(0.22,1,0.36,1)' }}
          strokeLinecap="round"
        />
      </svg>
      <svg viewBox="0 0 72 72" width="72" height="72" style={{ position: 'absolute', inset: 0 }}>
        <path d="M22 37l9 9 19-19" fill="none" stroke="var(--red)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray="40"
          strokeDashoffset={drawn ? 0 : 40}
          style={{ transition: 'stroke-dashoffset 0.5s cubic-bezier(0.22,1,0.36,1) 0.5s' }}
        />
      </svg>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  const [confetti, setConfetti] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setConfetti(true), 200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ fontFamily: 'var(--sans)', background: 'var(--off-white)', minHeight: '100vh', color: 'var(--ink)' }}>

      {/* Confetti dots */}
      {confetti && (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              width: i % 3 === 0 ? 8 : 5,
              height: i % 3 === 0 ? 8 : 5,
              borderRadius: i % 2 === 0 ? '50%' : 1,
              background: ['var(--red)', '#f59e0b', '#3b82f6', '#22c55e', '#a855f7'][i % 5],
              left: `${(i * 4.3 + 3) % 100}%`,
              top: '-10px',
              animation: `fall ${1.8 + (i % 3) * 0.4}s ease-in ${(i * 0.07)}s forwards`,
              opacity: 0,
            }} />
          ))}
        </div>
      )}

      {/* Nav */}
      <nav style={{ background: 'var(--white)', borderBottom: '1px solid var(--border)', padding: '0 2rem', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 50 }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <div style={{ width: 28, height: 28, background: 'var(--red)', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'var(--serif)', fontWeight: 900, color: 'white', fontSize: '0.85rem' }}>Z</span>
          </div>
          <span style={{ fontFamily: 'var(--serif)', fontWeight: 900, fontSize: '1.1rem', color: 'var(--ink)', letterSpacing: '-0.02em' }}>Zylo<span style={{ color: 'var(--red)' }}>.</span></span>
        </Link>
        <Link href="/orders" style={{ fontSize: '0.84rem', color: 'var(--ink-muted)', textDecoration: 'none', fontWeight: 300 }}>My orders</Link>
      </nav>

      <div style={{ maxWidth: 680, margin: '3rem auto', padding: '0 1.5rem', position: 'relative', zIndex: 1 }}>

        {/* Success card */}
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '3rem 2.5rem', textAlign: 'center', marginBottom: '1.25rem', animation: 'fadeUp 0.5s ease both' }}>
          <SuccessCheckmark />
          <div style={{ fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--red)', marginBottom: '0.6rem' }}>Payment confirmed</div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: '2.2rem', fontWeight: 900, color: 'var(--ink)', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '0.75rem' }}>
            Order placed!
          </h1>
          <p style={{ color: 'var(--ink-faint)', fontWeight: 300, fontSize: '0.9rem', lineHeight: 1.6, maxWidth: 440, margin: '0 auto 1.5rem' }}>
            Your confirmation has been sent to <strong style={{ color: 'var(--ink)', fontWeight: 500 }}>{MOCK_CONFIRMATION.email}</strong>. We'll notify you when it ships.
          </p>

          {/* Order meta */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0', border: '1px solid var(--border)', borderRadius: 3, overflow: 'hidden', textAlign: 'left', marginBottom: '1.75rem' }}>
            {[
              { label: 'Order ID',       val: `#${MOCK_CONFIRMATION.orderId}` },
              { label: 'Total paid',     val: `$${MOCK_CONFIRMATION.total.toFixed(2)}` },
              { label: 'Est. delivery',  val: MOCK_CONFIRMATION.estimatedDelivery },
            ].map((m, i) => (
              <div key={m.label} style={{ padding: '0.9rem 1rem', borderLeft: i > 0 ? '1px solid var(--border)' : 'none', background: 'var(--off-white)' }}>
                <div style={{ fontSize: '0.62rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '0.2rem' }}>{m.label}</div>
                <div style={{ fontFamily: 'var(--serif)', fontWeight: 700, color: i === 1 ? 'var(--red)' : 'var(--ink)', fontSize: '0.9rem' }}>{m.val}</div>
              </div>
            ))}
          </div>

          {/* Payment method */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 2, padding: '0.4rem 0.85rem', marginBottom: '1.75rem', fontSize: '0.78rem', color: '#16a34a', fontWeight: 500 }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="6.5" fill="#bbf7d0"/><path d="M3.5 6.5l2 2 4-4" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Paid via {MOCK_CONFIRMATION.paymentMethod}
          </div>

          {/* CTA buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href={`/orders/${MOCK_CONFIRMATION.orderId}`} style={{ padding: '0.65rem 1.5rem', background: 'var(--red)', color: 'white', borderRadius: 2, textDecoration: 'none', fontWeight: 500, fontSize: '0.88rem' }}>
              Track order
            </Link>
            <Link href="/products" style={{ padding: '0.65rem 1.5rem', background: 'none', border: '1px solid var(--border)', color: 'var(--ink-muted)', borderRadius: 2, textDecoration: 'none', fontWeight: 300, fontSize: '0.88rem' }}>
              Continue shopping
            </Link>
          </div>
        </div>

        {/* Items summary */}
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '1.5rem', animation: 'fadeUp 0.5s ease 0.15s both' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '1.25rem' }}>Your items</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {MOCK_CONFIRMATION.items.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.85rem 0', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ width: 44, height: 44, background: 'var(--off-white)', border: '1px solid var(--border)', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>{item.image}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, color: 'var(--ink)', fontSize: '0.84rem' }}>{item.name}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--ink-faint)', marginTop: '0.1rem' }}>Qty {item.qty}</div>
                </div>
                <div style={{ fontFamily: 'var(--serif)', fontWeight: 700, color: 'var(--red)', fontSize: '0.9rem' }}>${item.price.toFixed(2)}</div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.85rem', marginTop: '0.25rem', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 500, color: 'var(--ink)', fontSize: '0.88rem' }}>Total</span>
            <span style={{ fontFamily: 'var(--serif)', fontWeight: 900, color: 'var(--red)', fontSize: '1.05rem' }}>${MOCK_CONFIRMATION.total.toFixed(2)}</span>
          </div>
        </div>

        {/* What's next */}
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '1.5rem', marginTop: '1.25rem', animation: 'fadeUp 0.5s ease 0.3s both' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '1rem' }}>What happens next</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {[
              { step: '1', title: 'Order confirmed',   desc: 'Your payment is verified and order is locked in.',       done: true  },
              { step: '2', title: 'Supplier notified', desc: 'Our AI router sends your order to the best supplier.',   done: true  },
              { step: '3', title: 'Shipped',           desc: "You'll get an email with tracking number when shipped.", done: false },
              { step: '4', title: 'Delivered',         desc: `Estimated by ${MOCK_CONFIRMATION.estimatedDelivery}.`,  done: false },
            ].map((s) => (
              <div key={s.step} style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: s.done ? 'var(--red)' : 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '0.05rem' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: s.done ? 'white' : 'var(--ink-faint)' }}>{s.step}</span>
                </div>
                <div>
                  <div style={{ fontWeight: 500, color: s.done ? 'var(--ink)' : 'var(--ink-faint)', fontSize: '0.84rem', marginBottom: '0.1rem' }}>{s.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--ink-faint)', fontWeight: 300 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fall {
          0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(105vh) rotate(720deg); opacity: 0; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 500px) {
          div[style*="grid-template-columns: 1fr 1fr 1fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}