import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken } from '@/lib/sessionCrypto';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || request.nextUrl.host || '';

  const adminDomain = process.env.ADMIN_DOMAIN || process.env.NEXT_PUBLIC_ADMIN_DOMAIN;
  const isAdminHost =
    hostname.startsWith('admin.') ||
    (adminDomain && hostname.includes(adminDomain)) ||
    process.env.NEXT_PUBLIC_IS_ADMIN_DOMAIN === 'true';

  const adminCookie = request.cookies.get('Vinayaka_admin_session')?.value;

  let isAuthenticated = false;
  if (adminCookie) {
    const session = await verifySessionToken(adminCookie);
    if (session) {
      isAuthenticated = true;
    }
  }

  // 1. Protect Admin API routes (except login API)
  if (pathname.startsWith('/api/admin') && pathname !== '/api/admin/login') {
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized administrator access' }, { status: 401 });
    }
    return NextResponse.next();
  }

  // 2. Subdomain Routing: If accessing via Admin Subdomain/Domain
  if (isAdminHost) {
    // Root '/' on admin domain goes straight to admin dashboard or login
    if (pathname === '/') {
      return NextResponse.redirect(
        new URL(isAuthenticated ? '/admin' : '/admin/login', request.url)
      );
    }
  } else if (adminDomain && pathname.startsWith('/admin')) {
    // Domain Separation: If trying to access /admin on Public Website Domain while ADMIN_DOMAIN is set
    const protocol = request.nextUrl.protocol || 'https:';
    const targetUrl = new URL(pathname, `${protocol}//${adminDomain}`);
    return NextResponse.redirect(targetUrl);
  }

  // 3. Protect /admin routes except /admin/login
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!isAuthenticated) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 4. If authenticated and accessing /admin/login, redirect to /admin dashboard
  if (pathname === '/admin/login' && isAuthenticated) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/admin/:path*', '/api/admin/:path*'],
};
