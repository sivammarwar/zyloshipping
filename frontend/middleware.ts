import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ADMIN_ROUTES = ['/dashboard'];
const USER_ROUTES  = ['/profile', '/orders', '/settings', '/checkout'];

function isAdminRoute(pathname: string) {
  return ADMIN_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'));
}

function isUserRoute(pathname: string) {
  return USER_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isAdminRoute(pathname)) {
    const token = request.cookies.get('admin_token')?.value;
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (isUserRoute(pathname)) {
    const token = request.cookies.get('auth_token')?.value;
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
    '/dashboard/:path*',
    '/profile/:path*',
    '/orders/:path*',
    '/settings/:path*',
    '/checkout/:path*',
  ],
};