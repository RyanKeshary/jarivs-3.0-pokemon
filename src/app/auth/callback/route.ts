import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function getDeployedOrigin(request: NextRequest): string {
  const forwardedHost = request.headers.get('x-forwarded-host');
  if (forwardedHost?.includes('indigo-techfest.vercel.app')) {
    return 'https://indigo-techfest.vercel.app';
  }
  if (forwardedHost?.includes('jarivs-3-0-pokemon.vercel.app')) {
    return 'https://indigo-techfest.vercel.app';
  }
  if (forwardedHost?.includes('jarivs-3-0-pokemon.onrender.com')) {
    return 'https://jarivs-3-0-pokemon.onrender.com';
  }
  const { origin } = new URL(request.url);
  if (origin?.includes('indigo-techfest.vercel.app')) {
    return 'https://indigo-techfest.vercel.app';
  }
  if (origin?.includes('jarivs-3-0-pokemon.vercel.app')) {
    return 'https://indigo-techfest.vercel.app';
  }
  if (origin?.includes('jarivs-3-0-pokemon.onrender.com')) {
    return 'https://jarivs-3-0-pokemon.onrender.com';
  }
  return process.env.NEXT_PUBLIC_APP_URL || 'https://indigo-techfest.vercel.app';
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') || '/auth?mode=update-password';
  const targetOrigin = getDeployedOrigin(request);

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${targetOrigin}${next}`);
      }
    } catch (err) {
      console.error('Error exchanging auth code for session:', err);
    }
  }

  // If code exchange failed or expired
  return NextResponse.redirect(`${targetOrigin}/auth?error=expired_or_invalid_code`);
}
