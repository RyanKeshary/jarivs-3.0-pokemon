import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://oqqzzyombtcjvlqbjvla.supabase.co';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_QMmz5ZNtmwnZssxC6KnH1g_zoRZ6FIr';

  const supabase = createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Redirect /dashboard to /
  if (pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Redirect legacy /master to /admin
  if (pathname.startsWith('/master')) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin',
    '/admin/:path*',
    '/master',
    '/master/:path*',
  ],
};
