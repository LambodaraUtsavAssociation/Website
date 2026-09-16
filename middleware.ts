import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken } from '@/lib/sessionCrypto';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const rawHostname = request.headers.get('host') || request.nextUrl.host || '';
  const hostname = rawHostname.split(':')[0].toLowerCase();

  const rawAdminDomain = (process.env.ADMIN_DOMAIN || process.env.NEXT_PUBLIC_ADMIN_DOMAIN || '').trim();
  const adminDomain = rawAdminDomain
    .replace(/^https?:\/\//i, '')
    .replace(/\/.*$/, '')
    .split(':')[0]
    .toLowerCase();

  const isLocalOrVercel =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.endsWith('.vercel.app');

  // A host is ONLY a dedicated admin host if it is an admin subdomain (e.g. admin.lambodarautsav.org)
  // or explicitly marked as IS_ADMIN_DOMAIN. The primary website (lambodarautsav.vercel.app / lambodarautsav.org)
  // is NEVER an admin host.
  const isAdminHost =
    hostname.startsWith('admin.') ||
    (adminDomain && adminDomain.startsWith('admin.') && hostname === adminDomain) ||
    process.env.NEXT_PUBLIC_IS_ADMIN_DOMAIN === 'true';

  // Public homepage '/' must ALWAYS load the main website for general visitors
  if (!isAdminHost && pathname === '/') {
    return NextResponse.next();
  }

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

  // 2. Subdomain Routing: If accessing via Dedicated Admin Subdomain (e.g. admin.lambodarautsav.org)
  if (isAdminHost) {
    // Root '/' on admin domain goes straight to admin dashboard or login
    if (pathname === '/') {
      return NextResponse.redirect(
        new URL(isAuthenticated ? '/admin' : '/admin/login', request.url)
      );
    }
  } else if (
    adminDomain &&
    adminDomain.startsWith('admin.') &&
    !isLocalOrVercel &&
    hostname !== adminDomain &&
    pathname.startsWith('/admin')
  ) {
    // Domain Separation: Only redirect custom production domains if a dedicated admin subdomain is set and different
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
