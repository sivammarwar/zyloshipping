'use client';

import { useState } from 'react';
import Link from 'next/link';

type Step = 'email' | 'sent' | 'reset' | 'done';

export default function ForgotPasswordPage() {
  const [step,     setStep]     = useState<Step>('email');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPw,   setShowPw]   = useState(false);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep('sent'); }, 1200);
  }

  function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (!password || password !== confirm) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep('done'); }, 1200);
  }

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : /[A-Z]/.test(password) && /[0-9]/.test(password) ? 4 : 3;
  const strengthColor = ['transparent', '#ef4444', '#f59e0b', '#22c55e', '#16a34a'][strength];
  const strengthLabel = ['', 'Too short', 'Weak', 'Good', 'Strong'][strength];

  return (
    <div style={{ fontFamily: 'var(--sans)', minHeight: '100vh', background: 'var(--off-white)', display: 'flex', flexDirection: 'column' }}>

      {/* Nav */}
      <nav style={{ background: 'var(--white)', borderBottom: '1px solid var(--border)', padding: '0 2rem', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <div style={{ width: 28, height: 28, background: 'var(--red)', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'var(--serif)', fontWeight: 900, color: 'white', fontSize: '0.85rem' }}>Z</span>
          </div>
          <span style={{ fontFamily: 'var(--serif)', fontWeight: 900, fontSize: '1.1rem', color: 'var(--ink)', letterSpacing: '-0.02em' }}>Zylo<span style={{ color: 'var(--red)' }}>.</span></span>
        </Link>
        <Link href="/login" style={{ fontSize: '0.84rem', color: 'var(--ink-muted)', textDecoration: 'none', fontWeight: 300 }}>Back to login</Link>
      </nav>

      {/* Card */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>

          {/* ── STEP: email entry ── */}
          {step === 'email' && (
            <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '2.5rem', animation: 'fadeUp 0.4s ease both' }}>
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{ width: 52, height: 52, background: 'var(--red-light)', border: '1px solid var(--red-mid)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--red)" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="4" width="16" height="12" rx="2"/><path d="M2 7l8 5 8-5"/></svg>
                </div>
                <div style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--red)', marginBottom: '0.4rem' }}>Account recovery</div>
                <h1 style={{ fontFamily: 'var(--serif)', fontSize: '1.75rem', fontWeight: 900, color: 'var(--ink)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>Forgot password?</h1>
                <p style={{ color: 'var(--ink-faint)', fontWeight: 300, fontSize: '0.84rem', marginTop: '0.6rem', lineHeight: 1.55 }}>No worries. Enter your email and we'll send a reset link.</p>
              </div>

              <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--ink-muted)', letterSpacing: '0.05em', display: 'block', marginBottom: '0.4rem' }}>Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1px solid var(--border)', borderRadius: 2, fontSize: '0.88rem', fontFamily: 'var(--sans)', outline: 'none', boxSizing: 'border-box', color: 'var(--ink)', transition: 'border-color 0.2s' }}
                    onFocus={e => e.currentTarget.style.borderColor = 'var(--red)'}
                    onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !email}
                  style={{ padding: '0.7rem', background: loading ? 'var(--red-mid)' : 'var(--red)', color: 'white', border: 'none', borderRadius: 2, fontSize: '0.88rem', fontWeight: 500, cursor: loading ? 'wait' : 'pointer', fontFamily: 'var(--sans)', transition: 'opacity 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  {loading ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" style={{ animation: 'spin 0.8s linear infinite' }}><path d="M7 1v2M7 11v2M1 7h2M11 7h2M2.93 2.93l1.41 1.41M9.66 9.66l1.41 1.41M2.93 11.07l1.41-1.41M9.66 4.34l1.41-1.41"/></svg>
                      Sending…
                    </>
                  ) : 'Send reset link'}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--ink-faint)' }}>
                Remember your password?{' '}
                <Link href="/login" style={{ color: 'var(--red)', textDecoration: 'none', fontWeight: 500 }}>Log in</Link>
              </div>
            </div>
          )}

          {/* ── STEP: email sent ── */}
          {step === 'sent' && (
            <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '2.5rem', textAlign: 'center', animation: 'fadeUp 0.4s ease both' }}>
              <div style={{ width: 64, height: 64, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 8l12 8 12-8"/><rect x="2" y="5" width="24" height="18" rx="2"/></svg>
              </div>
              <div style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#16a34a', marginBottom: '0.4rem' }}>Email sent</div>
              <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.6rem', fontWeight: 900, color: 'var(--ink)', letterSpacing: '-0.02em', marginBottom: '0.75rem' }}>Check your inbox</h2>
              <p style={{ color: 'var(--ink-faint)', fontWeight: 300, fontSize: '0.84rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                We sent a password reset link to<br />
                <strong style={{ color: 'var(--ink)', fontWeight: 500 }}>{email}</strong>
              </p>
              <div style={{ background: 'var(--off-white)', border: '1px solid var(--border)', borderRadius: 2, padding: '0.85rem 1rem', fontSize: '0.78rem', color: 'var(--ink-faint)', lineHeight: 1.55, marginBottom: '1.5rem', textAlign: 'left' }}>
                <strong style={{ color: 'var(--ink-muted)', fontWeight: 500 }}>Didn't get it?</strong><br />
                Check your spam folder, or wait a minute and try again. The link expires in 15 minutes.
              </div>
              <div style={{ display: 'flex', gap: '0.6rem', flexDirection: 'column' }}>
                <button onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 1000); }} style={{ padding: '0.6rem', background: 'var(--off-white)', border: '1px solid var(--border)', borderRadius: 2, fontSize: '0.82rem', color: 'var(--ink-muted)', cursor: 'pointer', fontFamily: 'var(--sans)' }}>
                  Resend email
                </button>
                {/* Demo: simulate clicking reset link */}
                <button onClick={() => setStep('reset')} style={{ padding: '0.6rem', background: 'var(--red)', color: 'white', border: 'none', borderRadius: 2, fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--sans)' }}>
                  (Demo) Open reset link →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP: new password ── */}
          {step === 'reset' && (
            <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '2.5rem', animation: 'fadeUp 0.4s ease both' }}>
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{ width: 52, height: 52, background: 'var(--red-light)', border: '1px solid var(--red-mid)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--red)" strokeWidth="1.5" strokeLinecap="round"><rect x="5" y="9" width="10" height="8" rx="1.5"/><path d="M7 9V6.5a3 3 0 016 0V9"/></svg>
                </div>
                <div style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--red)', marginBottom: '0.4rem' }}>New password</div>
                <h1 style={{ fontFamily: 'var(--serif)', fontSize: '1.75rem', fontWeight: 900, color: 'var(--ink)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>Reset password</h1>
                <p style={{ color: 'var(--ink-faint)', fontWeight: 300, fontSize: '0.84rem', marginTop: '0.6rem' }}>Choose a strong password you haven't used before.</p>
              </div>

              <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* New password */}
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--ink-muted)', letterSpacing: '0.05em', display: 'block', marginBottom: '0.4rem' }}>New password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      required
                      minLength={8}
                      style={{ width: '100%', padding: '0.65rem 2.5rem 0.65rem 0.85rem', border: '1px solid var(--border)', borderRadius: 2, fontSize: '0.88rem', fontFamily: 'var(--sans)', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                      onFocus={e => e.currentTarget.style.borderColor = 'var(--red)'}
                      onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
                    />
                    <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: '0.7rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)', padding: 0 }}>
                      {showPw ? (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 8s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z"/><circle cx="8" cy="8" r="1.5"/><path d="M2 2l12 12"/></svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 8s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z"/><circle cx="8" cy="8" r="1.5"/></svg>
                      )}
                    </button>
                  </div>
                  {/* Strength bar */}
                  {password.length > 0 && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <div style={{ height: 3, background: 'var(--border)', borderRadius: 2 }}>
                        <div style={{ height: '100%', width: `${(strength / 4) * 100}%`, background: strengthColor, borderRadius: 2, transition: 'width 0.3s, background 0.3s' }} />
                      </div>
                      <div style={{ fontSize: '0.68rem', color: strengthColor, marginTop: '0.25rem', fontWeight: 500 }}>{strengthLabel}</div>
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--ink-muted)', letterSpacing: '0.05em', display: 'block', marginBottom: '0.4rem' }}>Confirm password</label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Repeat your password"
                    required
                    style={{ width: '100%', padding: '0.65rem 0.85rem', border: `1px solid ${confirm && confirm !== password ? '#ef4444' : 'var(--border)'}`, borderRadius: 2, fontSize: '0.88rem', fontFamily: 'var(--sans)', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                    onFocus={e => e.currentTarget.style.borderColor = confirm !== password ? '#ef4444' : 'var(--red)'}
                    onBlur={e => e.currentTarget.style.borderColor = confirm && confirm !== password ? '#ef4444' : 'var(--border)'}
                  />
                  {confirm && confirm !== password && (
                    <div style={{ fontSize: '0.7rem', color: '#ef4444', marginTop: '0.25rem' }}>Passwords don't match</div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !password || password !== confirm || strength < 2}
                  style={{ padding: '0.7rem', background: 'var(--red)', color: 'white', border: 'none', borderRadius: 2, fontSize: '0.88rem', fontWeight: 500, cursor: loading ? 'wait' : 'pointer', fontFamily: 'var(--sans)', opacity: (!password || password !== confirm || strength < 2) ? 0.5 : 1, transition: 'opacity 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  {loading ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" style={{ animation: 'spin 0.8s linear infinite' }}><path d="M7 1v2M7 11v2M1 7h2M11 7h2"/></svg>
                      Updating…
                    </>
                  ) : 'Set new password'}
                </button>
              </form>
            </div>
          )}

          {/* ── STEP: done ── */}
          {step === 'done' && (
            <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '2.5rem', textAlign: 'center', animation: 'fadeUp 0.4s ease both' }}>
              <div style={{ width: 64, height: 64, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 14l6 6 12-12"/></svg>
              </div>
              <div style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#16a34a', marginBottom: '0.4rem' }}>All done</div>
              <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.75rem', fontWeight: 900, color: 'var(--ink)', letterSpacing: '-0.02em', marginBottom: '0.75rem' }}>Password updated!</h2>
              <p style={{ color: 'var(--ink-faint)', fontWeight: 300, fontSize: '0.84rem', lineHeight: 1.6, marginBottom: '1.75rem' }}>Your password has been reset. You can now log in with your new credentials.</p>
              <Link href="/login" style={{ display: 'block', padding: '0.7rem', background: 'var(--red)', color: 'white', borderRadius: 2, textDecoration: 'none', fontWeight: 500, fontSize: '0.88rem' }}>
                Go to login →
              </Link>
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.78rem', color: 'var(--ink-faint)' }}>
            © 2025 ZyloShipping · <Link href="/support" style={{ color: 'var(--ink-faint)', textDecoration: 'none' }}>Need help?</Link>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}