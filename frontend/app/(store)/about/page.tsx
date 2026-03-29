'use client';

import Link from 'next/link';

const TEAM: any[] = [];

const TIMELINE: any[] = [];

const VALUES = [
  { icon: '⚡', title: 'Speed first',       body: 'Orders routed to suppliers in seconds, not hours. Every workflow is optimised for zero manual intervention.' },
  { icon: '🤖', title: 'AI does the work',  body: 'Pricing, copy, support, routing — agents handle the operations so merchants focus on growth.' },
  { icon: '🇮🇳', title: 'India-built',      body: 'UPI-first, INR-native, built on Indian infrastructure. We know what fast, affordable payments look like.' },
  { icon: '🔍', title: 'Radical transparency', body: 'Every agent action is logged. Every margin is visible. No hidden fees, no black boxes.' },
];

export default function AboutPage() {
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
            <Link key={href} href={href} style={{ textDecoration: 'none', fontSize: '0.85rem', color: href === '/about' ? 'var(--red)' : 'var(--ink-muted)', fontWeight: href === '/about' ? 500 : 300, borderBottom: href === '/about' ? '1.5px solid var(--red)' : 'none', paddingBottom: 1 }}>{label}</Link>
          ))}
          <Link href="/dashboard" style={{ padding: '0.45rem 1rem', background: 'var(--red)', color: 'white', borderRadius: 2, textDecoration: 'none', fontSize: '0.82rem', fontWeight: 500 }}>Dashboard →</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ borderBottom: '1px solid var(--border)', padding: '5rem 2rem 4rem', maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--red)', marginBottom: '1rem' }}>About ZyloShipping</div>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(2.2rem, 6vw, 3.6rem)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.03em', color: 'var(--ink)', marginBottom: '1.5rem' }}>
          We built the store<br />we always wanted.
        </h1>
        <p style={{ fontSize: '1.05rem', lineHeight: 1.75, color: 'var(--ink-muted)', maxWidth: 580, margin: '0 auto', fontWeight: 300 }}>
          ZyloShipping is an AI-powered dropshipping platform built in India for the world. Eight autonomous agents handle pricing, content, routing, and support — so you don't have to.
        </p>
      </section>



      {/* Values */}
      <section style={{ padding: '4rem 2rem', maxWidth: 900, margin: '0 auto', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--red)', marginBottom: '2rem', textAlign: 'center' }}>What we believe</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
          {VALUES.map(v => (
            <div key={v.title} style={{ border: '1px solid var(--border)', borderRadius: 4, padding: '1.5rem' }}>
              <div style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>{v.icon}</div>
              <div style={{ fontFamily: 'var(--serif)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--ink)', marginBottom: '0.5rem' }}>{v.title}</div>
              <div style={{ fontSize: '0.84rem', color: 'var(--ink-muted)', lineHeight: 1.65, fontWeight: 300 }}>{v.body}</div>
            </div>
          ))}
        </div>
      </section>


      {/* CTA */}
      <section style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--serif)', fontSize: '2rem', fontWeight: 900, color: 'var(--ink)', letterSpacing: '-0.02em', marginBottom: '0.75rem' }}>Ready to automate your store?</h2>
        <p style={{ color: 'var(--ink-muted)', fontWeight: 300, marginBottom: '1.75rem', fontSize: '0.95rem' }}>Start for free. No credit card required.</p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/register" style={{ padding: '0.7rem 1.75rem', background: 'var(--red)', color: 'white', borderRadius: 2, textDecoration: 'none', fontWeight: 500, fontSize: '0.9rem' }}>Get started free</Link>
          <Link href="/pricing" style={{ padding: '0.7rem 1.75rem', background: 'none', color: 'var(--ink)', border: '1px solid var(--border)', borderRadius: 2, textDecoration: 'none', fontWeight: 300, fontSize: '0.9rem' }}>View pricing</Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <span style={{ fontFamily: 'var(--serif)', fontWeight: 900, fontSize: '1rem', color: 'var(--ink)', letterSpacing: '-0.02em' }}>Zylo<span style={{ color: 'var(--red)' }}>.</span></span>
        <span style={{ fontSize: '0.78rem', color: 'var(--ink-faint)' }}>© 2025 ZyloShipping. Built in Chennai 🇮🇳</span>
      </footer>

      <style jsx>{`
        @media (max-width: 700px) {
          section > div { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}