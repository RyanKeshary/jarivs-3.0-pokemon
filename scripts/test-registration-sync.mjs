import postgres from 'postgres';

const sql = postgres(
  process.env.DATABASE_URL ||
    'postgresql://postgres.oqqzzyombtcjvlqbjvla:golumolu1234$@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres',
  { ssl: 'require' }
);

async function testSync() {
  console.log('Testing End-to-End Registration & Admin Data Sync...');

  // 1. Create a Test Team
  const testCode = 'JRV-TEST';
  const testEmail = 'test.trainer@slrtce.in';
  const testPhone = '9876543210';
  const testName = 'Sync Verification Squad';
  const eventIds = ['project-exhibition', 'pid-geotto'];

  // Clean previous test if any
  await sql`DELETE FROM public.fest_teams WHERE code = ${testCode}`;

  const insertedTeam = await sql`
    INSERT INTO public.fest_teams (code, name, event_ids, leader_email, leader_token, status)
    VALUES (${testCode}, ${testName}, ${eventIds}, ${testEmail}, 'test_token_123', 'Confirmed')
    RETURNING id, code, name;
  `;
  const teamId = insertedTeam[0].id;
  console.log('✓ Inserted test squad into fest_teams:', insertedTeam[0]);

  // Insert Leader
  const insertedReg = await sql`
    INSERT INTO public.fest_registrations (
      team_id, team_code, is_leader, full_name, email, phone, college, department, year_of_study, status
    ) VALUES (
      ${teamId}, ${testCode}, true, 'Ash Ketchum', ${testEmail}, ${testPhone}, 'SLRTCE Mumbai', 'Computer Engineering', '3rd Year (TE)', 'Confirmed'
    ) RETURNING id, full_name, team_code;
  `;
  console.log('✓ Inserted participant into fest_registrations:', insertedReg[0]);

  // 2. Query Admin Metrics
  const registrations = await sql`
    SELECT fr.*, ft.name as team_name, ft.event_ids
    FROM public.fest_registrations fr
    JOIN public.fest_teams ft ON fr.team_id = ft.id
    WHERE ft.code = ${testCode}
  `;
  console.log('✓ Admin query fetched synced registration:', registrations[0].full_name, 'events:', registrations[0].event_ids);

  // 3. Verify per-event stats
  const events = await sql`SELECT id, name FROM public.fest_events WHERE id = ANY(${eventIds})`;
  for (const ev of events) {
    const teamsInEvent = await sql`SELECT count(*) FROM public.fest_teams WHERE ${ev.id} = ANY(event_ids)`;
    console.log(`✓ Event [${ev.id}] live teams count:`, teamsInEvent[0].count);
  }

  // 4. Clean up test record
  await sql`DELETE FROM public.fest_teams WHERE id = ${teamId}`;
  console.log('✓ Cleaned up test record. Full sync test PASSED!');

  await sql.end();
}

testSync().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
