import postgres from 'postgres';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

let connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres.oqqzzyombtcjvlqbjvla:golumolu1234$@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres';

// Ensure Supabase pooler uses transaction mode (port 6543) for serverless compatibility
if (connectionString.includes('pooler.supabase.com:5432')) {
  connectionString = connectionString.replace(':5432', ':6543');
}

export const sql = postgres(connectionString, {
  ssl: 'require',
  prepare: false,
  max: 10,
  idle_timeout: 15,
  connect_timeout: 10,
});

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://oqqzzyombtcjvlqbjvla.supabase.co';
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'sb_secret_ewtYkko7i-hunSbn7A2buw_1PBLpRn2';
  return createSupabaseClient(
    url,
    serviceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
