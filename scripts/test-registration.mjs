import postgres from 'postgres';

const sql = postgres('postgresql://postgres.oqqzzyombtcjvlqbjvla:golumolu1234$@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres', { ssl: 'require' });

async function main() {
  const events = await sql`SELECT id, name, day_label, capacity, is_open FROM public.fest_events ORDER BY id`;
  console.log('Seeded Fest Events:', events);

  const settings = await sql`SELECT id, name, tagline FROM public.event_settings WHERE id = 1`;
  console.log('Event Settings:', settings);

  const adminUser = await sql`
    SELECT id, email FROM auth.users WHERE LOWER(email) = 'shrey.sleeps@gmail.com'
  `;
  console.log('Admin user in auth.users:', adminUser);

  await sql.end();
}

main().catch(console.error);
