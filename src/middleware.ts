import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const host =
    request.headers.get('x-forwarded-host') ||
    request.headers.get('host') ||
    request.nextUrl.hostname ||
    '';

  // 1. Instant edge redirection from Render domain to Vercel production domain
  if (host.includes('onrender.com')) {
    const targetUrl = new URL(
      request.nextUrl.pathname + request.nextUrl.search,
      'https://jarivs-3-0-pokemon.vercel.app'
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
     * - favicon.ico, icon.png, apple-icon.png (icons)
     */
    '/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png).*)',
  ],
};
