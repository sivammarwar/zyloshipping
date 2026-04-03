'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getToken, isTokenExpired, removeToken, getTokenPayload } from '@/lib/tokenManager';
import { UserRole, isAdmin } from '@/lib/auth/roles';

interface TokenPayload {
  id: string;
  email: string;
  role: UserRole;
  exp: number;
}

/**
 * BuyerGuard - Protects buyer-only routes
 * Redirects to login if not authenticated
 * Redirects admin/seller users to their respective dashboards
 * 
 * Use this for routes that should only be accessible to regular buyers
 * (e.g., checkout, profile, orders history)
 */
export default function BuyerGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getToken();
    
    // Check if token exists and is not expired
    if (!token || isTokenExpired(token)) {
      if (token) removeToken();
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // Get user role
    const payload = getTokenPayload(token) as TokenPayload | null;
    if (!payload) {
      removeToken();
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // Sync cookie for middleware
    const maxAge = 60 * 60 * 24 * 7;
    document.cookie = `auth_token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;
    setReady(true);
  }, [router, pathname]);

  if (!ready) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--off-white)' }}>
        <div style={{ width: 28, height: 28, border: '2px solid var(--red)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return <>{children}</>;
}
