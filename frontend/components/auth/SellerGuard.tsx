'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getToken, isTokenExpired, removeToken } from '@/lib/tokenManager';

/**
 * SellerGuard - Protects seller dashboard routes
 * Redirects to login if not authenticated
 * Any authenticated user can access seller routes (they just need to create a store)
 */
export default function SellerGuard({ children }: { children: React.ReactNode }) {
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

    // Sync cookie for middleware
    const maxAge = 60 * 60 * 24 * 7;
    document.cookie = `admin_token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;
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
