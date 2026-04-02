'use client';

import { useState } from 'react';
import Link from 'next/link';

const FOUNDER_EMAIL = 'shivamkumarsingh8544@gmail.com';
const FOUNDER_PASSWORD = '@3088shivA2003';

export default function FounderLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simple client-side auth for founder
    if (email === FOUNDER_EMAIL && password === FOUNDER_PASSWORD) {
      // Store founder session
      localStorage.setItem('founder_token', 'founder_' + Date.now());
      localStorage.setItem('founder_email', email);
      window.location.href = '/adminsiva';
    } else {
      setError('Invalid founder credentials');
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--ink)', fontFamily: 'var(--sans)' }}>
      <div style={{ width: '100%', maxWidth: 400, padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: '2rem', fontWeight: 900, color: 'white', marginBottom: '0.5rem' }}>
            Zylo<span style={{ color: 'var(--red)' }}>.</span>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
            👑 Founder Admin Access
          </div>
        </div>

        <form onSubmit={handleLogin} style={{ background: 'var(--white)', padding: '2rem', borderRadius: 4 }}>
          {error && (
            <div style={{ padding: '0.75rem', background: '#fee2e2', color: '#991b1b', borderRadius: 4, fontSize: '0.85rem', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '0.35rem' }}>
              Founder Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="shivamkumarsingh8544@gmail.com"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border)',
                borderRadius: 2,
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '0.35rem' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border)',
                borderRadius: 2,
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.9rem',
              background: 'var(--red)',
              color: 'white',
              border: 'none',
              borderRadius: 2,
              fontSize: '0.9rem',
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Verifying...' : '🔐 Access Founder Panel'}
          </button>

          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <Link href="/" style={{ fontSize: '0.8rem', color: 'var(--ink-faint)', textDecoration: 'none' }}>
              ← Back to website
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
