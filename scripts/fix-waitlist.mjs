import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres.oqqzzyombtcjvlqbjvla:golumolu1234$@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres';
const sql = postgres(connectionString, { ssl: 'require' });

async function fixOverflow() {
  console.log('Auditing event capacities and putting overflow squads on waitlist...');
  const events = await sql`SELECT id, name, capacity FROM public.fest_events ORDER BY id`;

  for (const ev of events) {
    const teams = await sql`
      SELECT id, code, name, created_at, is_waitlist 
      FROM public.fest_teams 
      WHERE ${ev.id} = ANY(event_ids) 
      ORDER BY created_at ASC
    `;

    const cap = ev.capacity || 50;
    console.log(`Checking ${ev.id} (${ev.name}): Capacity ${cap}, Current teams: ${teams.length}`);

    if (teams.length > cap) {
      const confirmed = teams.slice(0, cap);
      const overflow = teams.slice(cap);

      console.log(`Found ${overflow.length} overflow team(s) for ${ev.id}. Updating to waitlist...`);
      for (const t of overflow) {
        console.log(` -> Marking team ${t.code} (${t.name}) as waitlist`);
        await sql`
          UPDATE public.fest_teams 
          SET is_waitlist = TRUE, status = 'Waitlist', updated_at = NOW() 
          WHERE id = ${t.id}
        `;
        await sql`
          UPDATE public.fest_registrations 
          SET status = 'Waitlist' 
          WHERE team_id = ${t.id}
        `;
      }
    }
  }

  console.log('\nAudit complete. Checking final stats...');
  const waitlistTeams = await sql`SELECT id, code, name, is_waitlist FROM public.fest_teams WHERE is_waitlist = TRUE`;
  console.log(`Total waitlisted teams: ${waitlistTeams.length}`);
  waitlistTeams.forEach(t => console.log(`- ${t.code}: ${t.name}`));

  await sql.end();
}

fixOverflow().catch(err => {
  console.error(err);
  process.exit(1);
});
