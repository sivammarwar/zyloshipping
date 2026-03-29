import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if accessing admin dashboard routes
  if (pathname.startsWith('/dashboard')) {
    // Check for token in cookies or we'll check on client side
    // For now, let client-side handle auth check
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
