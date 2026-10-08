import postgres from 'postgres';

const sql = postgres('postgresql://postgres.oqqzzyombtcjvlqbjvla:golumolu1234$@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres', { ssl: 'require' });

async function main() {
  await sql`DELETE FROM public.fest_events WHERE id = 'reelax'`;
  const events = await sql`SELECT id, name, day_label, capacity, is_open FROM public.fest_events ORDER BY id`;
  console.log('Seeded Fest Events (' + events.length + '):', events);

  const teamCount = await sql`SELECT count(*) FROM public.fest_teams`;
  const regCount = await sql`SELECT count(*) FROM public.fest_registrations`;
  console.log('Fest Teams count:', teamCount[0].count, 'Fest Registrations count:', regCount[0].count);

  const settings = await sql`SELECT id, name, tagline FROM public.event_settings WHERE id = 1`;
  console.log('Event Settings:', settings);

  await sql.end();
}

main().catch(console.error);
