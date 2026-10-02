import { createClient } from '@supabase/supabase-js';

import type { Database } from './database.types';

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

/**
 * Failing loudly beats rendering an empty page.
 *
 * If this throws, App.tsx's error boundary shows the message, which tells the
 * developer exactly which variable is missing instead of a wall of
 * "cannot read property of undefined" further down the tree.
 */
if (!url || !publishableKey) {
  throw new Error(
    'Supabase is not configured.\n\n' +
      'Copy .env.example to .env and set:\n' +
      '  VITE_SUPABASE_URL\n' +
      '  VITE_SUPABASE_PUBLISHABLE_KEY\n\n' +
      'then restart the dev server (Vite only reads .env at startup).',
  );
}

/**
 * The publishable key is safe to ship. Every request it signs runs as `anon` or
 * `authenticated` and is filtered by the RLS policies in migration 0004.
 * The secret key must never reach this file.
 */
export const supabase = createClient<Database>(url, publishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // Magic links (Phase 2) come back as a URL fragment and need picking up.
    detectSessionInUrl: true,
  },
  realtime: {
    // The countdown only needs a few small rows; a low rate keeps the socket
    // cheap and the browser responsive on a phone.
    params: { eventsPerSecond: 2 },
  },
  global: {
    headers: { 'X-Client-Info': 'kanto-league-web' },
  },
});

export const supabaseUrl = url;
