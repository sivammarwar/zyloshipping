'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function StartSellingPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    // FIX: always mark checking as done so the label updates correctly
    setChecking(false);

    if (token && user) {
      // User is logged in → go straight to dashboard (store creation lives there)
      router.push('/dashboard');
    } else {
      // Not logged in → send to register, then bounce back to dashboard afterwards
      router.push('/register?redirect=/dashboard');
    }
  }, [router]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f8fafc',
      fontFamily: 'var(--sans)'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontFamily: 'var(--serif)',
          fontSize: '1.6rem',
          fontWeight: 900,
          color: 'var(--ink)'
        }}>
          Zylo<span style={{ color: 'var(--red)' }}>.</span>
        </div>
        <p style={{
          marginTop: '1rem',
          fontSize: '0.85rem',
          color: 'var(--ink-muted)'
        }}>
          {checking ? 'Checking your account...' : 'Redirecting...'}
        </p>
      </div>
    </div>
  );
}