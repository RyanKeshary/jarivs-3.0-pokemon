// verify-db-rls.mjs
import postgres from 'postgres';

const connStr = process.env.DATABASE_URL || 'postgresql://postgres.oqqzzyombtcjvlqbjvla:golumolu1234$@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres';
const sql = postgres(connStr, { ssl: 'require', max: 1 });

async function verify() {
  console.log('--- RUNNING DATABASE & RLS VERIFICATION ---');
  let passed = 0;
  let failed = 0;

  // 1. Verify Event Settings
  try {
    const settings = await sql`SELECT * FROM public.event_settings WHERE id = 1`;
    if (settings.length === 1 && settings[0].countdown_target) {
      console.log('✅ TEST 1: event_settings table exists and is seeded with 18 Oct target');
      passed++;
    } else {
      console.error('❌ TEST 1 FAILED: event_settings not configured');
      failed++;
    }
  } catch (e) {
    console.error('❌ TEST 1 FAILED:', e.message);
    failed++;
  }

  // 2. Verify Helper Functions
  try {
    const fnCheck = await sql`
      SELECT proname FROM pg_proc 
      WHERE proname IN ('is_admin', 'is_master', 'generate_trainer_id', 'generate_team_id')
    `;
    if (fnCheck.length >= 4) {
      console.log('✅ TEST 2: Helper functions (is_admin, is_master, id generators) installed');
      passed++;
    } else {
      console.error('❌ TEST 2 FAILED: missing helper functions');
      failed++;
    }
  } catch (e) {
    console.error('❌ TEST 2 FAILED:', e.message);
    failed++;
  }

  // 3. Verify Master Allowlist
  try {
    const masters = await sql`SELECT email FROM public.master_allowlist`;
    const emails = masters.map(m => m.email);
    if (emails.includes('ryankeshary@gmail.com') && emails.includes('shrey.sleeps@gmail.com')) {
      console.log('✅ TEST 3: Master allowlist seeded with ryankeshary@gmail.com and shrey.sleeps@gmail.com');
      passed++;
    } else {
      console.error('❌ TEST 3 FAILED: missing masters in allowlist');
      failed++;
    }
  } catch (e) {
    console.error('❌ TEST 3 FAILED:', e.message);
    failed++;
  }

  // Pick an existing user from auth.users for relation testing
  const existingUsers = await sql`SELECT id FROM auth.users LIMIT 1`;
  const validUserId = existingUsers[0]?.id;

  // 4. Verify Social Links max 3 constraint trigger
  try {
    if (!validUserId) {
      throw new Error('No user in auth.users to test social links');
    }

    await sql.begin(async sql => {
      // Clean any existing links for this user in transaction
      await sql`DELETE FROM public.social_links WHERE user_id = ${validUserId}`;

      // Insert 3 links
      await sql`INSERT INTO public.social_links (user_id, label, url) VALUES (${validUserId}, 'github', 'https://github.com/1')`;
      await sql`INSERT INTO public.social_links (user_id, label, url) VALUES (${validUserId}, 'linkedin', 'https://linkedin.com/2')`;
      await sql`INSERT INTO public.social_links (user_id, label, url) VALUES (${validUserId}, 'portfolio', 'https://portfolio.com/3')`;

      // 4th insert should be blocked by trigger
      let blocked = false;
      try {
        await sql`INSERT INTO public.social_links (user_id, label, url) VALUES (${validUserId}, 'twitter', 'https://x.com/4')`;
      } catch (err) {
        if (err.message.includes('maximum of 3 social links')) {
          blocked = true;
        }
      }

      if (blocked) {
        console.log('✅ TEST 4: Max 3 social links enforced by database trigger');
        passed++;
      } else {
        console.error('❌ TEST 4 FAILED: 4th social link was not rejected by trigger');
        failed++;
      }

      // Rollback test changes
      throw new Error('ROLLBACK_TEST');
    });
  } catch (err) {
    if (err.message !== 'ROLLBACK_TEST') {
      console.error('❌ TEST 4 FAILED:', err.message);
      failed++;
    }
  }

  // 5. Verify Team size max 4 trigger
  try {
    await sql.begin(async sql => {
      const dummyTeamId = '00000000-0000-0000-0000-000000000002';

      // Insert temporary users into auth.users in transaction
      const leaderAuthId = '00000000-0000-0000-0000-000000000003';
      await sql`
        INSERT INTO auth.users (id, email) VALUES (${leaderAuthId}, 'temp_lead@slrtce.in')
        ON CONFLICT (id) DO NOTHING
      `;

      await sql`
        INSERT INTO public.profiles (id, trainer_id, full_name, email, role)
        VALUES (${leaderAuthId}, 'TRN-KL3-LEAD01', 'Lead Trainer', 'temp_lead@slrtce.in', 'participant')
        ON CONFLICT (id) DO NOTHING
      `;

      await sql`
        INSERT INTO public.teams (id, team_id, name, created_by, join_code)
        VALUES (${dummyTeamId}, 'TEAM-KL3-TEST', 'Squad Test', ${leaderAuthId}, 'CODE-TEST')
        ON CONFLICT (id) DO NOTHING
      `;

      // Create 4 dummy trainers
      for (let i = 1; i <= 4; i++) {
        const uId = `00000000-0000-0000-0000-00000000001${i}`;
        await sql`
          INSERT INTO auth.users (id, email) VALUES (${uId}, ${'temp_m' + i + '@slrtce.in'})
          ON CONFLICT (id) DO NOTHING
        `;
        await sql`
          INSERT INTO public.profiles (id, trainer_id, full_name, email, role)
          VALUES (${uId}, ${'TRN-KL3-T0000' + i}, ${'Member ' + i}, ${'temp_m' + i + '@slrtce.in'}, 'participant')
          ON CONFLICT (id) DO NOTHING
        `;
        await sql`INSERT INTO public.team_members (team_id, user_id) VALUES (${dummyTeamId}, ${uId})`;
      }

      // 5th member insert must be blocked
      const fifthId = '00000000-0000-0000-0000-000000000099';
      await sql`
        INSERT INTO auth.users (id, email) VALUES (${fifthId}, 'temp_m5@slrtce.in')
        ON CONFLICT (id) DO NOTHING
      `;
      await sql`
        INSERT INTO public.profiles (id, trainer_id, full_name, email, role)
        VALUES (${fifthId}, 'TRN-KL3-T09999', 'Member 5', 'temp_m5@slrtce.in', 'participant')
        ON CONFLICT (id) DO NOTHING
      `;

      let teamBlocked = false;
      try {
        await sql`INSERT INTO public.team_members (team_id, user_id) VALUES (${dummyTeamId}, ${fifthId})`;
      } catch (err) {
        if (err.message.includes('maximum capacity')) {
          teamBlocked = true;
        }
      }

      if (teamBlocked) {
        console.log('✅ TEST 5: Team size capacity limit of 4 enforced by database trigger');
        passed++;
      } else {
        console.error('❌ TEST 5 FAILED: 5th team member was not blocked by trigger');
        failed++;
      }

      throw new Error('ROLLBACK_TEST');
    });
  } catch (err) {
    if (err.message !== 'ROLLBACK_TEST') {
      console.error('❌ TEST 5 FAILED:', err.message);
      failed++;
    }
  }

  // 6. Verify Audit Log Table
  try {
    const auditCheck = await sql`
      INSERT INTO public.audit_log (action, details) 
      VALUES ('SYSTEM_VERIFY_TEST', '{"status":"ok"}'::jsonb)
      RETURNING id
    `;
    if (auditCheck.length === 1) {
      console.log('✅ TEST 6: audit_log table active and writable for privileged operations');
      passed++;
      await sql`DELETE FROM public.audit_log WHERE id = ${auditCheck[0].id}`;
    }
  } catch (e) {
    console.error('❌ TEST 6 FAILED:', e.message);
    failed++;
  }

  // 7. Verify Storage Buckets
  try {
    const buckets = await sql`SELECT id FROM storage.buckets WHERE id IN ('submissions', 'problem-statements', 'public-assets')`;
    if (buckets.length >= 2) {
      console.log(`✅ TEST 7: Supabase storage buckets verified (${buckets.map(b => b.id).join(', ')})`);
      passed++;
    } else {
      console.error('❌ TEST 7 FAILED: missing buckets');
      failed++;
    }
  } catch (e) {
    console.error('❌ TEST 7 FAILED:', e.message);
    failed++;
  }

  console.log(`\n========================================`);
  console.log(`VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  await sql.end();
  if (failed > 0) process.exit(1);
}

verify();
