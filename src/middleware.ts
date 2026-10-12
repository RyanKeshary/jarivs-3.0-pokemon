import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || request.nextUrl.host || '';

  // 1. Redirect Render domain to Vercel production URL
  if (host.includes('onrender.com')) {
    const targetUrl = new URL(
      request.nextUrl.pathname + request.nextUrl.search,
      'https://indigo-techfest.vercel.app'
    );
    return NextResponse.redirect(targetUrl, 308);
  }

  const pathname = request.nextUrl.pathname;

  // 2. Redirect /dashboard to /
  if (pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 3. Redirect legacy /master to /admin
  if (pathname.startsWith('/master')) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
