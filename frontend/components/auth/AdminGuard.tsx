'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp && Date.now() >= payload.exp * 1000) {
        localStorage.removeItem('token');
        document.cookie = 'admin_token=; path=/; max-age=0; SameSite=Lax';
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }
    } catch {
      localStorage.removeItem('token');
      document.cookie = 'admin_token=; path=/; max-age=0; SameSite=Lax';
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    // Sync cookie in case it was cleared (e.g. browser restart)
    const maxAge = 60 * 60 * 24 * 7;
    document.cookie = `admin_token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;
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