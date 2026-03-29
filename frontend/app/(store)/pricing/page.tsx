'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type Billing = 'monthly' | 'annual';

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
}

const FAQ = [
  { q: 'Is UPI payment included on all plans?', a: 'Yes. UPI via Razorpay (GPay, PhonePe, Paytm, BHIM, VPA collect, QR) is available on every plan — including the free Starter plan. International card payments via Stripe are available on Growth and above.' },
  { q: 'What counts as an "order"?', a: 'Any order that reaches PAYMENT_CONFIRMED status counts. Cancelled or failed payment orders are not counted against your monthly limit.' },
  { q: 'Can I change plans at any time?', a: 'Yes. Upgrades are immediate; downgrades take effect at the end of your billing cycle. Unused days are prorated.' },
  { q: 'Do the AI agents cost extra?', a: 'No. All 8 agents (content, pricing, routing, support, etc.) are included in Growth and Pro. OpenAI API costs are absorbed into your plan price.' },
  { q: 'Is there a free trial?', a: 'Growth offers a 14-day free trial with full access. No credit card required to start.' },
];

export default function PricingPage() {
  const [billing, setBilling] = useState<Billing>('annual');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPlans() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/pricing`);
        const data = await res.json();
        setPlans(data.plans || []);
      } catch (error) {
        console.error('Failed to fetch pricing plans:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchPlans();
  }, []);

  function price(plan: PricingPlan) {
    const p = billing === 'annual' ? plan.annualPrice : plan.monthlyPrice;
    return p === 0 ? 'Free' : `₹${(p / 100).toLocaleString()}`;
  }

  const annualSavings = (p: PricingPlan) => {
    if (p.monthlyPrice === 0) return null;
    const saved = ((p.monthlyPrice - p.annualPrice) * 12) / 100;
    return `Save ₹${saved.toLocaleString()}/yr`;
  };

  function getCtaHref(plan: PricingPlan) {
    if (plan.planId === 'starter') return '/register';
    if (plan.planId === 'pro') return '/contact';
    return `/register?plan=${plan.planId}`;
  }

  return (
    <div style={{ fontFamily: 'var(--sans)', color: 'var(--ink)', minHeight: '100vh', background: 'var(--white)' }}>

      {/* Nav */}
      <nav style={{ borderBottom: '1px solid var(--border)', padding: '0 2rem', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'var(--white)', zIndex: 50 }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <div style={{ width: 28, height: 28, background: 'var(--red)', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'var(--serif)', fontWeight: 900, color: 'white', fontSize: '0.85rem' }}>Z</span>
          </div>
          <span style={{ fontFamily: 'var(--serif)', fontWeight: 900, fontSize: '1.1rem', color: 'var(--ink)', letterSpacing: '-0.02em' }}>Zylo<span style={{ color: 'var(--red)' }}>.</span></span>
        </Link>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          {[['Products', '/products'], ['Pricing', '/pricing'], ['About', '/about']].map(([label, href]) => (
            <Link key={href} href={href} style={{ textDecoration: 'none', fontSize: '0.85rem', color: href === '/pricing' ? 'var(--red)' : 'var(--ink-muted)', fontWeight: href === '/pricing' ? 500 : 300, borderBottom: href === '/pricing' ? '1.5px solid var(--red)' : 'none', paddingBottom: 1 }}>{label}</Link>
          ))}
          <Link href="/dashboard" style={{ padding: '0.45rem 1rem', background: 'var(--red)', color: 'white', borderRadius: 2, textDecoration: 'none', fontSize: '0.82rem', fontWeight: 500 }}>Dashboard →</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: '4rem 2rem 3rem', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--red)', marginBottom: '1rem' }}>Pricing</div>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.03em', color: 'var(--ink)', marginBottom: '1rem' }}>
          Simple, transparent pricing.
        </h1>
        <p style={{ fontSize: '1rem', color: 'var(--ink-muted)', fontWeight: 300, marginBottom: '2rem', maxWidth: 480, margin: '0 auto 2rem' }}>
          All plans include UPI payments, Razorpay integration, and no hidden fees.
        </p>

        {/* Billing toggle */}
        <div style={{ display: 'inline-flex', border: '1px solid var(--border)', borderRadius: 2, overflow: 'hidden', marginTop: '1.5rem' }}>
          {(['monthly', 'annual'] as Billing[]).map(b => (
            <button key={b} onClick={() => setBilling(b)} style={{ padding: '0.5rem 1.25rem', background: billing === b ? 'var(--ink)' : 'var(--white)', color: billing === b ? 'white' : 'var(--ink-muted)', border: 'none', fontSize: '0.82rem', fontWeight: billing === b ? 500 : 300, cursor: 'pointer', fontFamily: 'var(--sans)', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {b === 'monthly' ? 'Monthly' : (
                <>Annual <span style={{ fontSize: '0.65rem', background: '#f0fdf4', color: '#16a34a', padding: '0.1rem 0.35rem', borderRadius: 1, fontWeight: 500 }}>−33%</span></>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Plans */}
      <section style={{ padding: '3rem 2rem', maxWidth: 1040, margin: '0 auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--ink-faint)' }}>Loading pricing plans...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', alignItems: 'start' }}>
            {plans.map((plan: PricingPlan) => (
              <div key={plan.id} style={{ border: plan.isHighlight ? '2px solid var(--red)' : '1px solid var(--border)', borderRadius: 4, padding: '2rem 1.75rem', position: 'relative', background: plan.isHighlight ? 'var(--off-white)' : 'var(--white)', transition: 'box-shadow 0.2s' }} onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.07)'} onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>

                {/* Badge */}
                {plan.badge && (
                  <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'var(--red)', color: 'white', fontSize: '0.65rem', fontWeight: 600, padding: '0.2rem 0.7rem', borderRadius: 1, letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{plan.badge}</div>
                )}

                {/* Plan header */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ fontFamily: 'var(--serif)', fontWeight: 900, fontSize: '1.25rem', color: 'var(--ink)', marginBottom: '0.25rem' }}>{plan.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--ink-faint)', fontWeight: 300, marginBottom: '1.25rem', lineHeight: 1.5 }}>{plan.tagline}</div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.25rem' }}>
                    <span style={{ fontFamily: 'var(--serif)', fontWeight: 900, fontSize: '2.25rem', color: plan.isHighlight ? 'var(--red)' : 'var(--ink)', lineHeight: 1 }}>{price(plan)}</span>
                    {plan.monthlyPrice > 0 && <span style={{ fontSize: '0.78rem', color: 'var(--ink-faint)', marginBottom: '0.3rem' }}>/mo</span>}
                  </div>
                  {billing === 'annual' && plan.monthlyPrice > 0 && (
                    <div style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 500, marginTop: '0.3rem' }}>{annualSavings(plan)}</div>
                  )}
                </div>

                {/* CTA */}
                <Link href={getCtaHref(plan)} style={{ display: 'block', textAlign: 'center', padding: '0.65rem', background: plan.isHighlight ? 'var(--red)' : 'var(--ink)', color: 'white', borderRadius: 2, textDecoration: 'none', fontWeight: 500, fontSize: '0.85rem', marginBottom: '1.5rem', transition: 'opacity 0.15s' }} onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.87'} onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}>
                  {plan.ctaText}
                </Link>

                {/* Features */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {plan.features.map((f: string) => (
                    <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.55rem', fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0, marginTop: 2 }}><circle cx="6.5" cy="6.5" r="6.5" fill="#f0fdf4"/><path d="M3.5 6.5l2 2 4-4" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      {f}
                    </div>
                  ))}
                  {plan.limits.map((f: string) => (
                    <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.55rem', fontSize: '0.82rem', color: 'var(--ink-faint)' }}>
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0, marginTop: 2 }}><circle cx="6.5" cy="6.5" r="6.5" fill="#f3f4f6"/><path d="M4.5 4.5l4 4M8.5 4.5l-4 4" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round"/></svg>
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Feature comparison strip */}
      <section style={{ padding: '0 2rem 3rem', maxWidth: 1040, margin: '0 auto', borderTop: '1px solid var(--border)' }}>
        <div style={{ paddingTop: '2.5rem', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--red)', marginBottom: '0.5rem' }}>Included on all plans</div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--ink)' }}>What's always free</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          {[
            { icon: '💳', label: 'UPI payments',         sub: 'GPay, PhonePe, Paytm, BHIM, QR' },
            { icon: '🔒', label: 'HMAC webhook verify',  sub: 'Razorpay & Stripe signatures verified' },
            { icon: '📦', label: 'Order tracking',       sub: 'AfterShip integration' },
            { icon: '🧾', label: 'Invoice generation',   sub: 'Auto PDF invoices per order' },
            { icon: '🛡️', label: 'SSL & security',       sub: 'Enterprise-grade by default' },
            { icon: '📧', label: 'Transactional email',  sub: 'Order confirms via Resend' },
          ].map(f => (
            <div key={f.label} style={{ display: 'flex', gap: '0.75rem', padding: '1rem', border: '1px solid var(--border)', borderRadius: 3 }}>
              <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>{f.icon}</span>
              <div>
                <div style={{ fontWeight: 500, color: 'var(--ink)', fontSize: '0.85rem', marginBottom: '0.15rem' }}>{f.label}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--ink-faint)' }}>{f.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: '3rem 2rem', maxWidth: 680, margin: '0 auto', borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--red)', marginBottom: '1.5rem', textAlign: 'center' }}>FAQ</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {FAQ.map((item, i) => (
            <div key={i} style={{ borderTop: '1px solid var(--border)' }}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width: '100%', background: 'none', border: 'none', padding: '1.1rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontFamily: 'var(--sans)', textAlign: 'left', gap: '1rem' }}>
                <span style={{ fontWeight: 500, color: 'var(--ink)', fontSize: '0.9rem' }}>{item.q}</span>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--ink-faint)" strokeWidth="1.5" strokeLinecap="round" style={{ flexShrink: 0, transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}><path d="M2 5l5 5 5-5"/></svg>
              </button>
              {openFaq === i && (
                <div style={{ fontSize: '0.84rem', color: 'var(--ink-muted)', lineHeight: 1.65, fontWeight: 300, paddingBottom: '1.1rem' }}>{item.a}</div>
              )}
            </div>
          ))}
          <div style={{ borderTop: '1px solid var(--border)' }} />
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '4rem 2rem', textAlign: 'center', background: 'var(--ink)', borderTop: '1px solid var(--border)' }}>
        <h2 style={{ fontFamily: 'var(--serif)', fontSize: '2rem', fontWeight: 900, color: 'white', letterSpacing: '-0.02em', marginBottom: '0.75rem' }}>Start selling in minutes.</h2>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontWeight: 300, marginBottom: '1.75rem', fontSize: '0.95rem' }}>14-day free trial on Growth. No credit card needed.</p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/register?plan=growth" style={{ padding: '0.7rem 1.75rem', background: 'var(--red)', color: 'white', borderRadius: 2, textDecoration: 'none', fontWeight: 500, fontSize: '0.9rem' }}>Try Growth free</Link>
          <Link href="/about" style={{ padding: '0.7rem 1.75rem', background: 'none', color: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 2, textDecoration: 'none', fontWeight: 300, fontSize: '0.9rem' }}>Learn more</Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.08)', background: 'var(--ink)', padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <span style={{ fontFamily: 'var(--serif)', fontWeight: 900, fontSize: '1rem', color: 'white', letterSpacing: '-0.02em' }}>Zylo<span style={{ color: 'var(--red)' }}>.</span></span>
        <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.25)' }}>© 2025 ZyloShipping. Built in Chennai 🇮🇳</span>
      </footer>

      <style jsx>{`
        @media (max-width: 860px) {
          section > div { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}