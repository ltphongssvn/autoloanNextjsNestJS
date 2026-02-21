// apps/frontend/src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicPaths = ['/', '/login', '/signup', '/forgot-password', '/reset-password'];

function decodeTokenPayload(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;

  if (publicPaths.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next();
  }

  if (!token && pathname.startsWith('/dashboard')) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (token && pathname.startsWith('/dashboard')) {
    const payload = decodeTokenPayload(token);
    const role = (payload?.role as string) || 'customer';

    if (pathname.startsWith('/dashboard/loan-officer') && role !== 'loan_officer') {
      const dashUrl = new URL(role === 'underwriter' ? '/dashboard/underwriter' : '/dashboard', request.url);
      return NextResponse.redirect(dashUrl);
    }
    if (pathname.startsWith('/dashboard/underwriter') && role !== 'underwriter') {
      const dashUrl = new URL(role === 'loan_officer' ? '/dashboard/loan-officer' : '/dashboard', request.url);
      return NextResponse.redirect(dashUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
