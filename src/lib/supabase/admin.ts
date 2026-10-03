import postgres from 'postgres';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres.oqqzzyombtcjvlqbjvla:golumolu1234$@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres';

export const sql = postgres(connectionString, {
  ssl: 'require',
  max: 10,
});

export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
