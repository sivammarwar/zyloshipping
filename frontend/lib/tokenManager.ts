// frontend/lib/tokenManager.ts
const TOKEN_KEY = 'auth_token';
const REFRESH_THRESHOLD = 60000; // 60 seconds

interface TokenPayload {
  id: string;
  email: string;
  role: string;
  exp: number;
  iat: number;
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
  // Sync to cookie so Next.js middleware can protect routes server-side
  const maxAge = 60 * 60 * 24 * 7; // 7 days
  document.cookie = `auth_token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function removeToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  document.cookie = 'auth_token=; path=/; max-age=0; SameSite=Lax';
}

export function getTokenExpiry(token: string): number {
  try {
    const payload = JSON.parse(atob(token.split('.')[1])) as TokenPayload;
    return payload.exp * 1000;
  } catch {
    return 0;
  }
}

export function isTokenExpiringSoon(token: string): boolean {
  const expiry = getTokenExpiry(token);
  if (!expiry) return true;
  return expiry - Date.now() < REFRESH_THRESHOLD;
}

export function isTokenExpired(token: string): boolean {
  const expiry = getTokenExpiry(token);
  if (!expiry) return true;
  return Date.now() >= expiry;
}

export async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/refresh`,
      { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.accessToken) { setToken(data.accessToken); return data.accessToken; }
    return null;
  } catch { return null; }
}

export async function ensureValidToken(): Promise<string | null> {
  const token = getToken();
  if (!token) return null;
  if (isTokenExpired(token)) return await refreshAccessToken();
  if (isTokenExpiringSoon(token)) return (await refreshAccessToken()) || token;
  return token;
}

export function clearAuth(): void {
  if (typeof window === 'undefined') return;
  removeToken();
  localStorage.removeItem('user');
  // Clear admin cookie too
  document.cookie = 'admin_token=; path=/; max-age=0; SameSite=Lax';
}

export function getTokenPayload(token: string): TokenPayload | null {
  try { return JSON.parse(atob(token.split('.')[1])) as TokenPayload; }
  catch { return null; }
}

export function getUserFromToken(): TokenPayload | null {
  const token = getToken();
  if (!token) return null;
  return getTokenPayload(token);
}