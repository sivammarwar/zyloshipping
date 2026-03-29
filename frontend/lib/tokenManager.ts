// frontend/lib/tokenManager.ts
// JWT Token Management with Auto-Refresh

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
}

export function removeToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
}

export function getTokenExpiry(token: string): number {
  try {
    const payload = JSON.parse(atob(token.split('.')[1])) as TokenPayload;
    return payload.exp * 1000; // Convert to milliseconds
  } catch {
    return 0;
  }
}

export function isTokenExpiringSoon(token: string): boolean {
  const expiryTime = getTokenExpiry(token);
  if (!expiryTime) return true;
  
  const timeUntilExpiry = expiryTime - Date.now();
  return timeUntilExpiry < REFRESH_THRESHOLD;
}

export function isTokenExpired(token: string): boolean {
  const expiryTime = getTokenExpiry(token);
  if (!expiryTime) return true;
  
  return Date.now() >= expiryTime;
}

export async function refreshAccessToken(): Promise<string | null> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`,
      {
        method: 'POST',
        credentials: 'include', // Send cookies with refresh token
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('[TokenManager] Refresh failed:', response.status);
      return null;
    }

    const data = await response.json();
    
    if (data.accessToken) {
      setToken(data.accessToken);
      return data.accessToken;
    }

    return null;
  } catch (error) {
    console.error('[TokenManager] Refresh error:', error);
    return null;
  }
}

export async function ensureValidToken(): Promise<string | null> {
  const token = getToken();
  
  if (!token) {
    return null;
  }

  // If token is expired, try to refresh
  if (isTokenExpired(token)) {
    console.log('[TokenManager] Token expired, refreshing...');
    return await refreshAccessToken();
  }

  // If token is expiring soon, refresh proactively
  if (isTokenExpiringSoon(token)) {
    console.log('[TokenManager] Token expiring soon, refreshing...');
    const newToken = await refreshAccessToken();
    return newToken || token; // Return old token if refresh fails
  }

  return token;
}

export function clearAuth(): void {
  removeToken();
  // Clear any other auth-related data
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user');
  }
}

export function getTokenPayload(token: string): TokenPayload | null {
  try {
    return JSON.parse(atob(token.split('.')[1])) as TokenPayload;
  } catch {
    return null;
  }
}

export function getUserFromToken(): TokenPayload | null {
  const token = getToken();
  if (!token) return null;
  return getTokenPayload(token);
}
