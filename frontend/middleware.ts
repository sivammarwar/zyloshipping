import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Role constants matching the backend
const USER_ROLES = {
  CUSTOMER: 'CUSTOMER',
  ADMIN: 'ADMIN',
  OWNER: 'OWNER',
};

// Route definitions by role
const ADMIN_ROUTES = ['/adminsiva'];
const SELLER_ROUTES = ['/dashboard'];
const BUYER_ROUTES = ['/profile', '/orders', '/settings', '/checkout'];

// Helper to check if path matches route patterns
function matchesRoute(pathname: string, routes: string[]) {
  return routes.some(r => pathname === r || pathname.startsWith(r + '/'));
}

// Helper to decode token and get role
function getRoleFromToken(token: string): string | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role || null;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check admin routes (founder/admin panel)
  if (matchesRoute(pathname, ADMIN_ROUTES)) {
    const token = request.cookies.get('admin_token')?.value;
    if (!token) {
      const loginUrl = new URL('/adminsiva/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
    const role = getRoleFromToken(token);
    // Only OWNER and ADMIN can access admin routes
    if (role !== USER_ROLES.ADMIN && role !== USER_ROLES.OWNER) {
      // Redirect non-admin users to home
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Check seller routes (dashboard)
  if (matchesRoute(pathname, SELLER_ROUTES)) {
    const token = request.cookies.get('admin_token')?.value || request.cookies.get('auth_token')?.value;
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    // Any authenticated user can access seller routes (they may or may not have a store)
  }

  // Check buyer routes (profile, orders, etc.)
  if (matchesRoute(pathname, BUYER_ROUTES)) {
    const token = request.cookies.get('auth_token')?.value || request.cookies.get('admin_token')?.value;
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/adminsiva/:path*',
    '/dashboard/:path*',
    '/profile',
    '/profile/:path*',
    '/orders/:path*',
    '/settings/:path*',
    '/checkout/:path*',
  ],
};