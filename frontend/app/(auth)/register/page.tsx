'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Step = 1 | 2;

// InputField component - defined outside RegisterPage to avoid focus loss
const InputField = ({ label, value, onChange, type = 'text', placeholder = '', children }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; children?: React.ReactNode }) => {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      <label style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{ width: '100%', padding: '0.75rem 0.9rem', border: `1.5px solid ${focused ? 'var(--red)' : 'var(--border)'}`, borderRadius: 2, fontSize: '0.88rem', fontFamily: 'var(--sans)', color: 'var(--ink)', background: 'var(--white)', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box', paddingRight: children ? '2.75rem' : '0.9rem' }} />
        {children && <div style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}>{children}</div>}
      </div>
    </div>
  );
};

export default function RegisterPage() {
  const [step, setStep]           = useState<Step>(1);
  const [loading, setLoading]     = useState(false);
  const [done, setDone]           = useState(false);
  const router = useRouter();

  // Step 1 fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);

  // Step 2 fields
  const [storeType, setStoreType] = useState('');
  const [country, setCountry]     = useState('');
  const [currency, setCurrency]   = useState('USD');
  const [agreed, setAgreed]       = useState(false);
  const [error, setError]         = useState('');

  const STORE_TYPES = ['Electronics', 'Fashion & Apparel', 'Home & Living', 'Beauty & Wellness', 'Sports & Fitness', 'General Store', 'Other'];
  const COUNTRIES   = ['United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'Singapore', 'India', 'Japan', 'Other'];

  const strength = (() => {
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];
  const strengthColor = ['', '#ef4444', '#f59e0b', '#3b82f6', '#22c55e'][strength];

  function handleStep1() {
    if (!firstName || !lastName || !email || !password) { setError('Please fill in all fields.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setError('');
    setStep(2);
  }

  async function handleRegister() {
    if (!storeType || !country) { setError('Please complete all fields.'); return; }
    if (!agreed) { setError('Please accept the Terms of Service.'); return; }
    setError('');
    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://zyloshippingbackend-production.up.railway.app';
      const res = await fetch(`${apiUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          name: `${firstName} ${lastName}`,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setError('Email already registered. Please sign in instead.');
        } else {
          setError(data.error || 'Registration failed. Please try again.');
        }
        setLoading(false);
        return;
      }

      // Save token and user data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      setLoading(false);
      setDone(true);
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      setLoading(false);
    }
  }

  // ── Done screen ───────────────────────────────────────────
  if (done) {
    // Auto-redirect to dashboard after 2 seconds
    useEffect(() => {
      const timer = setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
      return () => clearTimeout(timer);
    }, [router]);

    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--off-white)', padding: '2rem', fontFamily: 'var(--sans)' }}>
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', boxShadow: '0 8px 32px rgba(196,30,58,0.3)' }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 16l7 7L27 9"/></svg>
          </div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: '2.2rem', fontWeight: 900, color: 'var(--ink)', letterSpacing: '-0.025em', marginBottom: '0.75rem' }}>You&apos;re in!</h1>
          <p style={{ fontSize: '0.92rem', color: 'var(--ink-muted)', fontWeight: 300, marginBottom: '0.5rem' }}>
            Welcome to ZyloShipping, <strong>{firstName}</strong>. Your account is ready.
          </p>
          <p style={{ fontSize: '0.82rem', color: 'var(--ink-faint)', marginBottom: '2.5rem' }}>
            Redirecting to your dashboard...
          </p>
          <Link href="/dashboard" style={{ padding: '0.8rem 2rem', background: 'var(--red)', color: 'var(--white)', borderRadius: 2, textDecoration: 'none', fontSize: '0.88rem', fontWeight: 500, fontFamily: 'var(--sans)', boxShadow: '0 4px 18px rgba(196,30,58,0.25)' }}>
            Go to dashboard →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr', fontFamily: 'var(--sans)' }}>

      {/* ── Left panel ── */}
      <div style={{ background: 'var(--ink)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '3rem', position: 'relative', overflow: 'hidden' }} className="auth-left-panel">
        <div style={{ position: 'absolute', top: -100, left: -100, width: 350, height: 350, borderRadius: '50%', background: 'var(--red)', opacity: 0.07 }} />
        <div style={{ position: 'absolute', bottom: -60, right: -60, width: 250, height: 250, borderRadius: '50%', border: '40px solid rgba(255,255,255,0.03)' }} />

        <Link href="/" style={{ fontFamily: 'var(--serif)', fontSize: '1.6rem', fontWeight: 900, color: 'var(--white)', textDecoration: 'none', letterSpacing: '-0.02em', position: 'relative', zIndex: 1 }}>
          Zylo<span style={{ color: 'var(--red)' }}>.</span>
        </Link>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.8rem, 2.5vw, 2.5rem)', fontWeight: 900, color: 'var(--white)', letterSpacing: '-0.025em', lineHeight: 1.1, marginBottom: '1.5rem' }}>
            Start selling globally<br />
            <span style={{ color: 'var(--red)' }}>in minutes.</span>
          </h2>

          {/* Feature list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            {[
              { icon: '🤖', text: 'AI writes your product descriptions' },
              { icon: '📦', text: 'Auto-orders from suppliers on every sale' },
              { icon: '💳', text: 'Stripe, PayPal, Apple Pay built in' },
              { icon: '📍', text: 'Real-time tracking for every order' },
              { icon: '↩️', text: '7-day hassle-free return handling' },
              { icon: '🌍', text: 'Ship to 200+ countries worldwide' },
            ].map((f) => (
              <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', flexShrink: 0 }}>{f.icon}</div>
                <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', fontWeight: 300 }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.25)', position: 'relative', zIndex: 1 }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'underline' }}>Sign in →</Link>
        </div>
      </div>

      {/* ── Right: Form ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 4vw', background: 'var(--off-white)', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>

          {/* Step indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
            {[1, 2].map((s) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: s <= step ? 'var(--red)' : 'var(--white)', border: `1.5px solid ${s <= step ? 'var(--red)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontFamily: 'var(--serif)', fontWeight: 700, color: s <= step ? 'white' : 'var(--ink-faint)', transition: 'all 0.2s' }}>
                  {s < step ? <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M2 5l2.5 2.5L8 3"/></svg> : s}
                </div>
                <span style={{ fontSize: '0.72rem', color: s === step ? 'var(--red)' : 'var(--ink-faint)', fontWeight: s === step ? 500 : 300 }}>
                  {s === 1 ? 'Your account' : 'Store setup'}
                </span>
                {s < 2 && <div style={{ width: 32, height: 1, background: step > s ? 'var(--red)' : 'var(--border)', transition: 'background 0.3s', marginLeft: '0.25rem' }} />}
              </div>
            ))}
          </div>

          <h1 style={{ fontFamily: 'var(--serif)', fontSize: '1.8rem', fontWeight: 900, color: 'var(--ink)', letterSpacing: '-0.02em', marginBottom: '0.35rem' }}>
            {step === 1 ? 'Create your account' : 'Set up your store'}
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', fontWeight: 300, marginBottom: '1.75rem' }}>
            {step === 1 ? (
              <>Already registered? <Link href="/login" style={{ color: 'var(--red)', textDecoration: 'none', borderBottom: '1px solid var(--red-mid)' }}>Sign in</Link></>
            ) : 'Just two more things to personalise your experience.'}
          </p>

          {/* Error */}
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 2, padding: '0.65rem 0.9rem', marginBottom: '1rem', fontSize: '0.8rem', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>⚠</span> {error}
            </div>
          )}

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <InputField label="First Name" value={firstName} onChange={setFirstName} placeholder="Ryan" />
                <InputField label="Last Name"  value={lastName}  onChange={setLastName}  placeholder="Khanna" />
              </div>
              <InputField label="Email Address" value={email} onChange={setEmail} type="email" placeholder="you@example.com" />
              <InputField label="Password" value={password} onChange={setPassword} type={showPass ? 'text' : 'password'} placeholder="Min 8 characters">
                <button onClick={() => setShowPass(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)', padding: 0, display: 'flex', alignItems: 'center' }}>
                  {showPass
                    ? <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M2 2l12 12M6.5 6.6A2 2 0 0 0 8 10a2 2 0 0 0 1.4-.6"/><path d="M8 4C4.5 4 1.7 6.3 1 8c.5 1.2 1.5 2.3 2.8 3.1M10.5 5.1A7 7 0 0 1 15 8c-.7 1.7-3.5 4-7 4"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M1 8C2.5 5 5 3 8 3s5.5 2 7 5c-1.5 3-4 5-7 5S2.5 11 1 8Z"/><circle cx="8" cy="8" r="2"/></svg>
                  }
                </button>
              </InputField>

              {/* Password strength */}
              {password && (
                <div>
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '0.3rem' }}>
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= strength ? strengthColor : 'var(--border)', transition: 'background 0.2s' }} />
                    ))}
                  </div>
                  <span style={{ fontSize: '0.7rem', color: strengthColor, fontWeight: 500 }}>{strengthLabel}</span>
                </div>
              )}

              <button onClick={handleStep1} style={{ width: '100%', padding: '0.85rem', background: 'var(--red)', color: 'var(--white)', border: 'none', borderRadius: 2, fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--sans)', boxShadow: '0 4px 18px rgba(196,30,58,0.25)', transition: 'background 0.2s, transform 0.15s', marginTop: '0.25rem' }} onMouseEnter={e => { e.currentTarget.style.background = 'var(--red-deep)'; e.currentTarget.style.transform = 'translateY(-1px)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'var(--red)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                Continue →
              </button>
            </div>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              {/* Store category */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>Store Category</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {STORE_TYPES.map(t => (
                    <button key={t} onClick={() => setStoreType(t)} style={{ padding: '0.4rem 0.8rem', border: `1.5px solid ${storeType === t ? 'var(--red)' : 'var(--border)'}`, borderRadius: 20, background: storeType === t ? 'var(--red)' : 'var(--white)', color: storeType === t ? 'var(--white)' : 'var(--ink-muted)', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'var(--sans)', transition: 'all 0.15s', fontWeight: storeType === t ? 500 : 300 }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Country */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>Your Country</label>
                <select value={country} onChange={e => setCountry(e.target.value)} style={{ padding: '0.75rem 0.9rem', border: '1.5px solid var(--border)', borderRadius: 2, fontSize: '0.88rem', fontFamily: 'var(--sans)', color: country ? 'var(--ink)' : 'var(--ink-faint)', background: 'var(--white)', outline: 'none' }} onFocus={e => e.currentTarget.style.borderColor = 'var(--red)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                  <option value="">Select your country…</option>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Currency */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>Billing Currency</label>
                <select value={currency} onChange={e => setCurrency(e.target.value)} style={{ padding: '0.75rem 0.9rem', border: '1.5px solid var(--border)', borderRadius: 2, fontSize: '0.88rem', fontFamily: 'var(--sans)', color: 'var(--ink)', background: 'var(--white)', outline: 'none' }} onFocus={e => e.currentTarget.style.borderColor = 'var(--red)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                  {['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD', 'INR', 'JPY'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Terms */}
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', cursor: 'pointer', fontSize: '0.78rem', color: 'var(--ink-muted)', lineHeight: 1.5, fontWeight: 300 }}>
                <div onClick={() => setAgreed(v => !v)} style={{ width: 18, height: 18, border: `1.5px solid ${agreed ? 'var(--red)' : 'var(--border)'}`, borderRadius: 2, background: agreed ? 'var(--red)' : 'var(--white)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, transition: 'all 0.15s', cursor: 'pointer' }}>
                  {agreed && <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 5l2.5 2.5L8 3"/></svg>}
                </div>
                <span>
                  I agree to the{' '}
                  <Link href="/terms" style={{ color: 'var(--red)', textDecoration: 'none', borderBottom: '1px solid var(--red-mid)' }}>Terms of Service</Link>
                  {' '}and{' '}
                  <Link href="/privacy" style={{ color: 'var(--red)', textDecoration: 'none', borderBottom: '1px solid var(--red-mid)' }}>Privacy Policy</Link>
                </span>
              </label>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={() => { setStep(1); setError(''); }} style={{ padding: '0.85rem 1.25rem', background: 'none', border: '1.5px solid var(--border)', borderRadius: 2, fontSize: '0.85rem', color: 'var(--ink-muted)', cursor: 'pointer', fontFamily: 'var(--sans)', transition: 'border-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--ink)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>← Back</button>
                <button onClick={handleRegister} disabled={loading} style={{ flex: 1, padding: '0.85rem', background: loading ? 'var(--red-deep)' : 'var(--red)', color: 'var(--white)', border: 'none', borderRadius: 2, fontSize: '0.9rem', fontWeight: 500, cursor: loading ? 'default' : 'pointer', fontFamily: 'var(--sans)', boxShadow: '0 4px 18px rgba(196,30,58,0.25)', transition: 'background 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  {loading ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />Creating account…</> : 'Create account →'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
          .auth-left-panel { display: none !important; }
        }
      `}</style>
    </div>
  );
}