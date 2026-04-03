'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);
  const [error, setError]       = useState('');

  async function handleLogin() {
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setError('');
    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://zyloshippingbackend-production.up.railway.app';
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Invalid credentials');
        setLoading(false);
        return;
      }

      if (data.token) {
        const maxAge = 60 * 60 * 24 * 7; // 7 days

        // Store in localStorage
        localStorage.setItem('token', data.token);

        // Set admin_token cookie so middleware protects /dashboard routes
        document.cookie = `admin_token=${data.token}; path=/; max-age=${maxAge}; SameSite=Lax`;

        // Also set auth_token cookie so middleware protects store user routes
        // (covers the case where the same login page is used for both roles)
        document.cookie = `auth_token=${data.token}; path=/; max-age=${maxAge}; SameSite=Lax`;

        // Notify header and other components about auth change
        window.dispatchEvent(new Event('auth-changed'));

        const params   = new URLSearchParams(window.location.search);
        const redirect = params.get('redirect') || '/';
        window.location.href = redirect;
      } else {
        setError('Login failed. Please try again.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Network error. Please check your connection.');
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setError('Google login is temporarily disabled.');
  }

  async function handleAppleLogin() {
    setError('Apple login is temporarily disabled.');
  }

  const SOCIAL = [
    {
      label: 'Continue with Google',
      key: 'google' as const,
      onClick: handleGoogleLogin,
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.616Z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
          <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
        </svg>
      ),
    },
    {
      label: 'Continue with Apple',
      key: 'apple' as const,
      onClick: handleAppleLogin,
      icon: (
        <svg width="16" height="18" viewBox="0 0 16 18" fill="currentColor">
          <path d="M13.173 9.497c-.02-2.15 1.754-3.19 1.836-3.245-1.001-1.462-2.557-1.663-3.11-1.685-1.322-.134-2.588.781-3.258.781-.67 0-1.7-.763-2.794-.743C4.29 4.629 2.853 5.577 2.07 7.02.48 9.949 1.656 14.3 3.199 16.68c.764 1.162 1.672 2.46 2.864 2.414 1.148-.046 1.58-.737 2.967-.737 1.387 0 1.775.737 2.99.715 1.237-.02 2.016-1.18 2.773-2.347a10.84 10.84 0 0 0 1.267-2.72c-.03-.014-2.42-.926-2.887-3.508ZM11.013 3.13C11.638 2.367 12.06 1.327 11.94.27c-.898.037-1.995.6-2.642 1.345-.576.665-1.085 1.733-.946 2.751.998.077 2.02-.51 2.662-1.236Z"/>
        </svg>
      ),
    },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr', fontFamily: 'var(--sans)' }}>

      {/* ── Left: Decorative panel ── */}
      <div style={{ background: 'var(--ink)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '3rem', position: 'relative', overflow: 'hidden' }} className="auth-left-panel">
        <div style={{ position: 'absolute', top: -120, right: -120, width: 400, height: 400, borderRadius: '50%', background: 'var(--red)', opacity: 0.08 }} />
        <div style={{ position: 'absolute', bottom: -80, left: -80, width: 280, height: 280, borderRadius: '50%', border: '50px solid rgba(255,255,255,0.03)' }} />
        <div style={{ position: 'absolute', top: '40%', left: '30%', width: 180, height: 180, borderRadius: '50%', border: '30px solid rgba(196,30,58,0.1)' }} />

        <Link href="/" style={{ fontFamily: 'var(--serif)', fontSize: '1.6rem', fontWeight: 900, color: 'var(--white)', textDecoration: 'none', letterSpacing: '-0.02em', position: 'relative', zIndex: 1 }}>
          Zylo<span style={{ color: 'var(--red)' }}>.</span>
        </Link>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--red)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ display: 'inline-block', width: 16, height: 1, background: 'var(--red)' }} />
            Trusted globally
          </div>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(2rem, 3vw, 2.8rem)', fontWeight: 900, color: 'var(--white)', letterSpacing: '-0.025em', lineHeight: 1.1, marginBottom: '1.5rem' }}>
            Ship anywhere.<br />
            <span style={{ color: 'var(--red)' }}>Sell everywhere.</span>
          </h2>
          <p style={{ fontSize: '0.92rem', color: 'rgba(255,255,255,0.45)', fontWeight: 300, lineHeight: 1.7, maxWidth: 340 }}>
            AI-powered dropshipping platform to source and ship products worldwide.
          </p>
        </div>

        <div style={{ position: 'relative', zIndex: 1 }} />
      </div>

      {/* ── Right: Login form ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 4vw', background: 'var(--off-white)' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>

          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontFamily: 'var(--serif)', fontSize: '2rem', fontWeight: 900, color: 'var(--ink)', letterSpacing: '-0.025em', marginBottom: '0.35rem' }}>
              Welcome back
            </h1>
            <p style={{ fontSize: '0.88rem', color: 'var(--ink-muted)', fontWeight: 300 }}>
              Don&apos;t have an account?{' '}
              <Link href="/register" style={{ color: 'var(--red)', textDecoration: 'none', fontWeight: 500, borderBottom: '1px solid var(--red-mid)' }}>
                Sign up free →
              </Link>
            </p>
          </div>

          {/* Social login */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
            {SOCIAL.map((s) => (
              <button
                key={s.label}
                onClick={s.onClick}
                disabled={socialLoading !== null}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.65rem',
                  padding: '0.75rem', background: 'var(--white)', border: '1.5px solid var(--border)',
                  borderRadius: 2, fontSize: '0.85rem', color: 'var(--ink)',
                  cursor: socialLoading !== null ? 'default' : 'pointer',
                  fontFamily: 'var(--sans)', fontWeight: 400, transition: 'border-color 0.2s, box-shadow 0.2s',
                  opacity: socialLoading !== null && socialLoading !== s.key ? 0.5 : 1,
                }}
                onMouseEnter={e => { if (!socialLoading) { e.currentTarget.style.borderColor = 'var(--ink)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; } }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                {socialLoading === s.key ? (
                  <span style={{ width: 16, height: 16, border: '2px solid rgba(0,0,0,0.15)', borderTopColor: 'var(--ink)', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                ) : s.icon}
                {socialLoading === s.key ? 'Connecting…' : s.label}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: '0.72rem', color: 'var(--ink-faint)', letterSpacing: '0.08em' }}>OR</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {/* Error */}
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 2, padding: '0.7rem 0.9rem', marginBottom: '1rem', fontSize: '0.8rem', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>⚠</span> {error}
            </div>
          )}

          {/* Email */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '0.4rem' }}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="you@example.com"
              style={{ width: '100%', padding: '0.75rem 0.9rem', border: '1.5px solid var(--border)', borderRadius: 2, fontSize: '0.9rem', fontFamily: 'var(--sans)', color: 'var(--ink)', background: 'var(--white)', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--red)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <label style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>Password</label>
              <Link href="/forgot-password" style={{ fontSize: '0.72rem', color: 'var(--red)', textDecoration: 'none', borderBottom: '1px solid var(--red-mid)' }}>Forgot?</Link>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="••••••••"
                style={{ width: '100%', padding: '0.75rem 2.75rem 0.75rem 0.9rem', border: '1.5px solid var(--border)', borderRadius: 2, fontSize: '0.9rem', fontFamily: 'var(--sans)', color: 'var(--ink)', background: 'var(--white)', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--red)'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
              />
              <button
                onClick={() => setShowPass(v => !v)}
                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)', padding: 0, display: 'flex', alignItems: 'center' }}
              >
                {showPass ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                    <path d="M2 2l12 12M6.5 6.6A2 2 0 0 0 8 10a2 2 0 0 0 1.4-.6"/>
                    <path d="M8 4C4.5 4 1.7 6.3 1 8c.5 1.2 1.5 2.3 2.8 3.1M10.5 5.1A7 7 0 0 1 15 8c-.7 1.7-3.5 4-7 4"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                    <path d="M1 8C2.5 5 5 3 8 3s5.5 2 7 5c-1.5 3-4 5-7 5S2.5 11 1 8Z"/>
                    <circle cx="8" cy="8" r="2"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleLogin}
            disabled={loading}
            style={{ width: '100%', padding: '0.85rem', background: loading ? 'var(--red-deep)' : 'var(--red)', color: 'var(--white)', border: 'none', borderRadius: 2, fontSize: '0.9rem', fontWeight: 500, cursor: loading ? 'default' : 'pointer', fontFamily: 'var(--sans)', letterSpacing: '0.03em', boxShadow: '0 4px 18px rgba(196,30,58,0.25)', transition: 'background 0.2s, transform 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = 'var(--red-deep)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
            onMouseLeave={e => { e.currentTarget.style.background = loading ? 'var(--red-deep)' : 'var(--red)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            {loading ? (
              <>
                <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                Signing in…
              </>
            ) : 'Sign in →'}
          </button>

          <p style={{ marginTop: '1.5rem', fontSize: '0.72rem', color: 'var(--ink-faint)', textAlign: 'center', lineHeight: 1.6 }}>
            By signing in, you agree to our{' '}
            <Link href="/terms" style={{ color: 'var(--ink-muted)', textDecoration: 'underline' }}>Terms</Link>
            {' '}and{' '}
            <Link href="/privacy" style={{ color: 'var(--ink-muted)', textDecoration: 'underline' }}>Privacy Policy</Link>.
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          div { grid-template-columns: 1fr !important; }
          .auth-left-panel { display: none !important; }
        }
      `}</style>
    </div>
  );
}