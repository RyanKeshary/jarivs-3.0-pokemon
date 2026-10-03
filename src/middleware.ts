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

  // Protect /dashboard
  if (pathname.startsWith('/dashboard') && !user) {
    return NextResponse.redirect(new URL('/auth?mode=login', request.url));
  }

  // Protect /admin and /master
  if (pathname.startsWith('/admin') || pathname.startsWith('/master')) {
    if (!user) {
      return NextResponse.redirect(new URL('/auth?mode=login', request.url));
    }

    const isMasterEmail =
      user.email === 'ryankeshary@gmail.com' ||
      user.email === 'shrey.sleeps@gmail.com';

    let role = isMasterEmail ? 'master' : null;

    if (!isMasterEmail) {
      // Check user role in profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      role = profile?.role;
    }

    const isStaff =
      isMasterEmail ||
      role === 'admin' ||
      role === 'master' ||
      role === 'manager';

    if (pathname.startsWith('/master') && role !== 'master' && role !== 'manager' && !isMasterEmail) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }

    if (pathname.startsWith('/admin') && !isStaff) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/master/:path*',
  ],
};
