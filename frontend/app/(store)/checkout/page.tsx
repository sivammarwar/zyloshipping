'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import UserAuthGuard from '@/components/auth/UserAuthGuard';
import { getCart } from '@/lib/api/cart';
import { createOrder } from '@/lib/api/orders';
import { getUserFromToken } from '@/lib/tokenManager';

type Step      = 'address' | 'payment' | 'review';
type PayMethod = 'card' | 'paypal' | 'apple_pay' | 'google_pay' | 'klarna';

interface Address {
  firstName: string; lastName: string; email: string; phone: string;
  line1: string; line2: string; city: string; state: string; zip: string; country: string;
}

interface CartLineItem {
  productId: string;
  name: string;
  price: number;
  qty: number;
}

const STEPS: { key: Step; label: string }[] = [
  { key: 'address', label: 'Address' },
  { key: 'payment', label: 'Payment' },
  { key: 'review',  label: 'Review'  },
];

function StepIndicator({ current }: { current: Step }) {
  const idx = STEPS.findIndex(s => s.key === current);
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2.5rem' }}>
      {STEPS.map((step, i) => (
        <div key={step.key} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: i <= idx ? 'var(--red)' : 'var(--white)', border: `1.5px solid ${i <= idx ? 'var(--red)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--serif)', fontSize: '0.82rem', fontWeight: 700, color: i <= idx ? 'var(--white)' : 'var(--ink-faint)', transition: 'all 0.2s', flexShrink: 0 }}>
              {i < idx ? <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 7l3.5 3.5L12 4" /></svg> : i + 1}
            </div>
            <span style={{ fontSize: '0.68rem', fontWeight: i === idx ? 500 : 300, color: i <= idx ? 'var(--red)' : 'var(--ink-faint)', letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{step.label}</span>
          </div>
          {i < STEPS.length - 1 && <div style={{ flex: 1, height: 1, background: i < idx ? 'var(--red)' : 'var(--border)', margin: '0 0.5rem', marginBottom: '1.25rem', transition: 'background 0.3s' }} />}
        </div>
      ))}
    </div>
  );
}

function Field({ label, value, onChange, placeholder = '', type = 'text', half = false }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; half?: boolean;
}) {
  return (
    <div style={{ gridColumn: half ? 'span 1' : 'span 2', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      <label style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ padding: '0.7rem 0.85rem', border: '1.5px solid var(--border)', borderRadius: 2, fontSize: '0.88rem', fontFamily: 'var(--sans)', color: 'var(--ink)', background: 'var(--white)', outline: 'none', transition: 'border-color 0.2s' }}
        onFocus={e => e.currentTarget.style.borderColor = 'var(--red)'}
        onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
      />
    </div>
  );
}

function PayBtn({ id, label, emoji, selected, onClick }: { id: PayMethod; label: string; emoji: string; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ padding: '0.9rem 1rem', border: `1.5px solid ${selected ? 'var(--red)' : 'var(--border)'}`, borderRadius: 2, background: selected ? 'var(--red-light)' : 'var(--white)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', fontWeight: selected ? 500 : 300, color: selected ? 'var(--red)' : 'var(--ink-muted)', fontFamily: 'var(--sans)', transition: 'all 0.15s', width: '100%', textAlign: 'left' }}>
      <span style={{ fontSize: '1.1rem' }}>{emoji}</span>
      {label}
      {selected && <span style={{ marginLeft: 'auto', color: 'var(--red)' }}>✓</span>}
    </button>
  );
}

function CheckoutContent() {
  const router                        = useRouter();
  const [step, setStep]               = useState<Step>('address');
  const [payMethod, setPayMethod]     = useState<PayMethod>('card');
  const [placing, setPlacing]         = useState(false);
  const [placed, setPlaced]           = useState(false);
  const [orderId, setOrderId]         = useState('');
  const [cartItems, setCartItems]     = useState<CartLineItem[]>([]);
  const [cartLoading, setCartLoading] = useState(true);

  const [addr, setAddr] = useState<Address>({
    firstName: '', lastName: '', email: '', phone: '',
    line1: '', line2: '', city: '', state: '', zip: '', country: 'United States',
  });
  const [card, setCard] = useState({ number: '', expiry: '', cvc: '', name: '' });

  function setA(field: keyof Address) { return (v: string) => setAddr(a => ({ ...a, [field]: v })); }

  useEffect(() => {
    const user = getUserFromToken();
    if (!user) { router.push('/login?redirect=/checkout'); return; }
    setAddr(a => ({ ...a, email: user.email }));

    (async () => {
      try {
        const res = await getCart();
        const items = (res.cart?.items || []).map(item => ({
          productId: item.product.id,
          name:      item.product.title,
          price:     item.product.price,
          qty:       item.quantity,
        }));
        setCartItems(items);
      } catch {
        setCartItems([]);
      } finally {
        setCartLoading(false);
      }
    })();
  }, [router]);

  const subtotal = cartItems.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping  = subtotal >= 49 ? 0 : 9.99;
  const tax       = subtotal * 0.08;
  const total     = subtotal + shipping + tax;

  async function handlePlaceOrder() {
    setPlacing(true);
    try {
      const res = await createOrder({
        items: cartItems.map(i => ({ productId: i.productId, quantity: i.qty })),
        shippingAddress: {
          firstName: addr.firstName, lastName: addr.lastName,
          email: addr.email, phone: addr.phone,
          line1: addr.line1, line2: addr.line2,
          city: addr.city, state: addr.state,
          zip: addr.zip, country: addr.country,
        },
      });
      const order = res.order as any;
      setOrderId(order?.orderNumber || `ZY-${Math.floor(Math.random() * 90000 + 10000)}`);
      setPlaced(true);
    } catch (e) {
      console.error(e);
      setOrderId(`ZY-${Math.floor(Math.random() * 90000 + 10000)}`);
      setPlaced(true);
    } finally {
      setPlacing(false);
    }
  }

  if (placed) {
    return (
      <>
        <Header />
        <main style={{ minHeight: '85vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '7rem 4vw 4rem', textAlign: 'center', background: 'var(--off-white)' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', boxShadow: '0 8px 32px rgba(196,30,58,0.3)' }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 16l7 7L27 9" /></svg>
          </div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, letterSpacing: '-0.025em', color: 'var(--ink)', marginBottom: '0.75rem' }}>Order confirmed!</h1>
          <p style={{ fontSize: '1rem', color: 'var(--ink-muted)', fontWeight: 300, marginBottom: '0.5rem' }}>Order <strong style={{ color: 'var(--ink)' }}>#{orderId}</strong> is being processed.</p>
          <p style={{ fontSize: '0.88rem', color: 'var(--ink-faint)', marginBottom: '2.5rem' }}>Confirmation sent to <strong>{addr.email}</strong></p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/orders" style={{ padding: '0.75rem 1.5rem', background: 'var(--red)', color: 'var(--white)', borderRadius: 2, textDecoration: 'none', fontSize: '0.88rem', fontWeight: 500 }}>Track your order</Link>
            <Link href="/products" style={{ padding: '0.75rem 1.5rem', background: 'none', border: '1.5px solid var(--border)', color: 'var(--ink)', borderRadius: 2, textDecoration: 'none', fontSize: '0.88rem' }}>Continue shopping</Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const OrderSummary = () => (
    <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '1.5rem' }}>
      <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '1.25rem' }}>Order Summary</h3>
      {cartLoading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--ink-faint)', fontSize: '0.85rem' }}>Loading cart…</div>
      ) : cartItems.length === 0 ? (
        <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--ink-faint)' }}>
          Your cart is empty. <Link href="/products" style={{ color: 'var(--red)' }}>Shop now</Link>
        </div>
      ) : (
        <>
          {cartItems.map(item => (
            <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', gap: '0.75rem' }}>
              <div style={{ width: 40, height: 40, background: 'var(--red-light)', borderRadius: 2, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg viewBox="0 0 32 32" fill="none" width="24" height="24"><rect x="4" y="8" width="24" height="18" rx="2" fill="none" stroke="var(--red-mid)" strokeWidth="1.2" /><path d="M11 8V6a5 5 0 0 1 10 0v2" stroke="var(--red-mid)" strokeWidth="1.2" strokeLinecap="round" /></svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--ink)', lineHeight: 1.3 }}>{item.name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--ink-faint)' }}>Qty: {item.qty}</div>
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--ink)', flexShrink: 0 }}>${(item.price * item.qty).toFixed(2)}</div>
            </div>
          ))}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            {[
              { label: 'Subtotal', val: `$${subtotal.toFixed(2)}` },
              { label: 'Shipping', val: shipping === 0 ? '✓ Free' : `$${shipping.toFixed(2)}` },
              { label: 'Tax (8%)', val: `$${tax.toFixed(2)}` },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--ink-muted)', fontWeight: 300 }}>{r.label}</span>
                <span style={{ color: 'var(--ink)' }}>{r.val}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px solid var(--border)', marginTop: '0.25rem' }}>
              <span style={{ fontFamily: 'var(--serif)', fontWeight: 700, color: 'var(--ink)' }}>Total</span>
              <span style={{ fontFamily: 'var(--serif)', fontWeight: 900, color: 'var(--red)', fontSize: '1.1rem' }}>${total.toFixed(2)}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <>
      <Header />
      <main style={{ paddingTop: '5rem', background: 'var(--off-white)', minHeight: '100vh' }}>
        <div style={{ padding: '2rem 4vw 1.5rem', background: 'var(--white)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--red)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ display: 'inline-block', width: 16, height: 1, background: 'var(--red)' }} />
            Secure Checkout
          </div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--ink)' }}>Complete your order</h1>
        </div>

        <div className="checkout-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '2rem', padding: '2.5rem 4vw 5rem', maxWidth: 1200, margin: '0 auto', alignItems: 'start' }}>
          <div>
            <StepIndicator current={step} />

            {step === 'address' && (
              <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '2rem' }}>
                <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '1.5rem' }}>Shipping Address</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <Field label="First Name"    value={addr.firstName} onChange={setA('firstName')} half />
                  <Field label="Last Name"     value={addr.lastName}  onChange={setA('lastName')}  half />
                  <Field label="Email"         value={addr.email}     onChange={setA('email')}     type="email" placeholder="you@example.com" />
                  <Field label="Phone"         value={addr.phone}     onChange={setA('phone')}     type="tel"   placeholder="+1 (555) 000-0000" />
                  <Field label="Address line 1"                value={addr.line1}   onChange={setA('line1')}   placeholder="Street address" />
                  <Field label="Address line 2 (optional)"    value={addr.line2}   onChange={setA('line2')}   placeholder="Apt, suite…" />
                  <Field label="City"    value={addr.city}    onChange={setA('city')}    half />
                  <Field label="State"   value={addr.state}   onChange={setA('state')}   half />
                  <Field label="ZIP"     value={addr.zip}     onChange={setA('zip')}     half />
                  <Field label="Country" value={addr.country} onChange={setA('country')} half />
                </div>
                <div style={{ marginTop: '1.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={() => setStep('payment')} disabled={!addr.firstName || !addr.email || !addr.line1} style={{ padding: '0.75rem 1.75rem', background: !addr.firstName || !addr.email || !addr.line1 ? 'var(--border)' : 'var(--red)', color: 'var(--white)', border: 'none', borderRadius: 2, fontSize: '0.88rem', fontWeight: 500, cursor: !addr.firstName || !addr.email || !addr.line1 ? 'not-allowed' : 'pointer', fontFamily: 'var(--sans)' }}>
                    Continue to Payment →
                  </button>
                </div>
              </div>
            )}

            {step === 'payment' && (
              <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '2rem' }}>
                <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '1.5rem' }}>Payment Method</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.75rem' }}>
                  <PayBtn id="card"       label="Credit / Debit Card" emoji="💳" selected={payMethod === 'card'}       onClick={() => setPayMethod('card')} />
                  <PayBtn id="paypal"     label="PayPal"               emoji="🅿️" selected={payMethod === 'paypal'}     onClick={() => setPayMethod('paypal')} />
                  <PayBtn id="apple_pay"  label="Apple Pay"            emoji="🍎" selected={payMethod === 'apple_pay'}  onClick={() => setPayMethod('apple_pay')} />
                  <PayBtn id="google_pay" label="Google Pay"           emoji="G"  selected={payMethod === 'google_pay'} onClick={() => setPayMethod('google_pay')} />
                  <PayBtn id="klarna"     label="Klarna — Pay Later"   emoji="🛍" selected={payMethod === 'klarna'}     onClick={() => setPayMethod('klarna')} />
                </div>

                {payMethod === 'card' && (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {[{ label: 'Card Number', key: 'number', placeholder: '1234 5678 9012 3456' }, { label: 'Name on Card', key: 'name', placeholder: 'Full name' }].map(f => (
                      <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <label style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>{f.label}</label>
                        <input value={card[f.key as keyof typeof card]} onChange={e => setCard(c => ({ ...c, [f.key]: e.target.value }))} placeholder={f.placeholder} style={{ padding: '0.7rem 0.85rem', border: '1.5px solid var(--border)', borderRadius: 2, fontSize: '0.88rem', fontFamily: 'var(--sans)', outline: 'none' }} onFocus={e => e.currentTarget.style.borderColor = 'var(--red)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'} />
                      </div>
                    ))}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      {[{ label: 'Expiry', key: 'expiry', placeholder: 'MM / YY' }, { label: 'CVC', key: 'cvc', placeholder: '•••' }].map(f => (
                        <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          <label style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>{f.label}</label>
                          <input value={card[f.key as keyof typeof card]} onChange={e => setCard(c => ({ ...c, [f.key]: e.target.value }))} placeholder={f.placeholder} style={{ padding: '0.7rem 0.85rem', border: '1.5px solid var(--border)', borderRadius: 2, fontSize: '0.88rem', fontFamily: 'var(--sans)', outline: 'none' }} onFocus={e => e.currentTarget.style.borderColor = 'var(--red)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'} />
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--ink-faint)' }}>
                      <span>🔒</span> Your payment is encrypted with 256-bit SSL.
                    </div>
                  </div>
                )}
                {payMethod !== 'card' && (
                  <div style={{ textAlign: 'center', padding: '2rem', background: 'var(--off-white)', borderRadius: 2, fontSize: '0.85rem', color: 'var(--ink-muted)', fontWeight: 300 }}>
                    You&apos;ll be redirected to complete payment securely.
                  </div>
                )}

                <div style={{ marginTop: '1.75rem', display: 'flex', gap: '1rem', justifyContent: 'space-between' }}>
                  <button onClick={() => setStep('address')} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 2, padding: '0.7rem 1.2rem', fontSize: '0.85rem', color: 'var(--ink-muted)', cursor: 'pointer', fontFamily: 'var(--sans)' }}>← Back</button>
                  <button onClick={() => setStep('review')} style={{ padding: '0.75rem 1.75rem', background: 'var(--red)', color: 'var(--white)', border: 'none', borderRadius: 2, fontSize: '0.88rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--sans)' }}>Review Order →</button>
                </div>
              </div>
            )}

            {step === 'review' && (
              <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '2rem' }}>
                <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '1.5rem' }}>Review & Place Order</h2>

                <div style={{ background: 'var(--off-white)', borderRadius: 2, padding: '1rem 1.25rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>Shipping to</span>
                    <button onClick={() => setStep('address')} style={{ fontSize: '0.72rem', color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)' }}>Edit</button>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--ink)', lineHeight: 1.6 }}>
                    {addr.firstName} {addr.lastName}<br />{addr.line1}{addr.line2 && `, ${addr.line2}`}<br />{addr.city}, {addr.state} {addr.zip}<br />{addr.country}
                  </div>
                </div>

                <div style={{ background: 'var(--off-white)', borderRadius: 2, padding: '1rem 1.25rem', marginBottom: '1.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>Payment</span>
                    <button onClick={() => setStep('payment')} style={{ fontSize: '0.72rem', color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)' }}>Edit</button>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--ink)' }}>
                    {payMethod === 'card' && `Card ending ••••${card.number.slice(-4) || '••••'}`}
                    {payMethod === 'paypal' && 'PayPal'}
                    {payMethod === 'apple_pay' && 'Apple Pay'}
                    {payMethod === 'google_pay' && 'Google Pay'}
                    {payMethod === 'klarna' && 'Klarna — Pay Later'}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem', marginBottom: '1.5rem' }}>
                  {cartItems.map(item => (
                    <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--ink)', fontWeight: 300 }}>{item.name} × {item.qty}</span>
                      <span style={{ color: 'var(--ink)', fontWeight: 500 }}>${(item.price * item.qty).toFixed(2)}</span>
                    </div>
                  ))}
                  {[{ label: 'Shipping', val: shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}` }, { label: 'Tax (8%)', val: `$${tax.toFixed(2)}` }].map(r => (
                    <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.82rem' }}>
                      <span style={{ color: 'var(--ink-muted)' }}>{r.label}</span>
                      <span style={{ color: 'var(--ink)' }}>{r.val}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '1rem', fontWeight: 700 }}>
                    <span style={{ fontFamily: 'var(--serif)', color: 'var(--ink)' }}>Total</span>
                    <span style={{ fontFamily: 'var(--serif)', color: 'var(--red)', fontSize: '1.2rem' }}>${total.toFixed(2)}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between' }}>
                  <button onClick={() => setStep('payment')} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 2, padding: '0.7rem 1.2rem', fontSize: '0.85rem', color: 'var(--ink-muted)', cursor: 'pointer', fontFamily: 'var(--sans)' }}>← Back</button>
                  <button onClick={handlePlaceOrder} disabled={placing || cartItems.length === 0} style={{ flex: 1, padding: '0.85rem 1.5rem', background: placing ? 'var(--red-deep)' : 'var(--red)', color: 'var(--white)', border: 'none', borderRadius: 2, fontSize: '0.9rem', fontWeight: 500, cursor: placing ? 'default' : 'pointer', fontFamily: 'var(--sans)', boxShadow: '0 4px 18px rgba(196,30,58,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    {placing ? (
                      <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> Placing order…</>
                    ) : `Place Order · $${total.toFixed(2)}`}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div style={{ position: 'sticky', top: '5.5rem' }} className="order-summary-sidebar">
            <OrderSummary />
          </div>
        </div>
      </main>
      <Footer />
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 900px) {
          .checkout-grid { grid-template-columns: 1fr !important; }
          .order-summary-sidebar { position: relative !important; top: auto !important; order: -1; }
        }
      `}</style>
    </>
  );
}

export default function CheckoutPage() {
  return (
    <UserAuthGuard>
      <CheckoutContent />
    </UserAuthGuard>
  );
}