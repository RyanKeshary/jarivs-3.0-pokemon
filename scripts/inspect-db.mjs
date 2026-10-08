import postgres from 'postgres';

const sql = postgres('postgresql://postgres.oqqzzyombtcjvlqbjvla:golumolu1234$@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres', { ssl: 'require' });

async function main() {
  const tables = await sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`;
  console.log('Tables:', tables.map(t => t.tablename));

  for (const t of ['registrations', 'teams', 'team_members', 'event_settings', 'audit_log']) {
    const cols = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = ${t}`;
    console.log(`\n--- ${t} ---`);
    console.log(cols.map(c => `${c.column_name}: ${c.data_type}`).join('\n'));
  }

  const eventSettings = await sql`SELECT id, name, tagline FROM public.event_settings`;
  console.log('Event Settings:', eventSettings);

  await sql.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
