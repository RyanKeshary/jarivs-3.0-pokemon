/**
 * Verifies the database guarantees this platform claims to have.
 *
 * These are not unit tests - they run against the real project and actually
 * attempt the operations that are supposed to be blocked. Run it after changing
 * any migration:
 *
 *   node scripts/verify-rls.mjs
 *
 * It creates throwaway auth users and deletes them again on the way out.
 */
import fs from 'node:fs';
import path from 'node:path';
import postgres from 'postgres';

import { ROOT, connectionOptions, describeTarget, loadEnv } from './lib/db.mjs';

loadEnv();

// postgres.js drops a second options argument, so everything goes in one object.
const ADMIN = postgres({ ...connectionOptions(), onnotice: () => {} });
const KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const SECRET = process.env.SUPABASE_SECRET_KEY;
const BASE = process.env.VITE_SUPABASE_URL;
if (!KEY || !BASE) throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY must be set in .env');

let pass = 0;
let fail = 0;
const created = [];

const g = (s) => `\x1b[32m${s}\x1b[0m`;
const r = (s) => `\x1b[31m${s}\x1b[0m`;
const d = (s) => `\x1b[2m${s}\x1b[0m`;

function check(name, condition, detail = '') {
  if (condition) {
    pass++;
    console.log(`  ${g('PASS')}  ${name}${detail ? d(`  ${detail}`) : ''}`);
  } else {
    fail++;
    console.log(`  ${r('FAIL')}  ${name}${detail ? r(`  ${detail}`) : ''}`);
  }
}

const PASSWORD = 'Kanto-League-2026!';

/**
 * Creates a throwaway auth user and returns the signup result.
 *
 * Uses the admin API rather than POST /auth/v1/signup for two reasons:
 *  - the public signup endpoint is rate limited per IP, so re-running this
 *    script would start failing with 429 for no real reason;
 *  - the admin API returns the created user synchronously, already confirmed.
 *
 * The important part is that it still lands in `auth.users`, which is what fires
 * the registration-guard trigger. So this genuinely tests the database rule.
 */
async function signUp(email, password = PASSWORD) {
  try {
    const userId = (await ADMIN`SELECT gen_random_uuid() as id;`)[0].id;
    await ADMIN`
      INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data,
        confirmation_token, recovery_token, email_change_token_new, email_change,
        created_at, updated_at
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        ${userId}, 'authenticated', 'authenticated', ${email},
        crypt(${password}, gen_salt('bf', 10)),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('sub', ${userId}::text, 'email', ${email}::text, 'full_name', 'Verify Bot'),
        '', '', '', '', now(), now()
      );
    `;
    created.push(userId);
    return { status: 200, body: { id: userId, email } };
  } catch (err) {
    return { status: 500, body: { msg: err.message } };
  }
}

/** Exchanges email+password for a session, the same call the login form makes. */
async function signIn(email) {
  const res = await fetch(`${BASE}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  return res.json();
}

async function anonQuery(table, query = 'select=*') {
  const res = await fetch(`${BASE}/rest/v1/${table}?${query}`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  });
  let body = null;
  try {
    body = await res.json();
  } catch {
    /* ignore */
  }
  return { status: res.status, body };
}

async function cleanup() {
  if (created.length === 0) return;
  await ADMIN`delete from auth.users where id = any(${created})`;
  console.log(d(`\ncleaned up ${created.length} throwaway auth user(s)`));
}

async function main() {
  console.log(d(`connected to ${describeTarget(connectionOptions())}\n`));

  // ---------------------------------------------------------------------
  console.log('registration guard (the @slrtce.in rule)');
  
  // Test allowlisted address
  const tempAllowlistEmail = `temp-allowed-${Date.now()}@gmail.com`;
  await ADMIN`insert into public.allowed_emails (email, note) values (${tempAllowlistEmail}, 'verify test')`;
  const gmail = await signUp(tempAllowlistEmail);
  await ADMIN`delete from public.allowed_emails where email = ${tempAllowlistEmail}`;

  check(
    'allowlisted gmail address is accepted',
    gmail.status === 200 && gmail.body?.id,
    `status ${gmail.status}`,
  );

  const stranger = await signUp(`stranger-${Date.now()}@gmail.com`);
  check(
    'un-allowlisted gmail address is REJECTED by the database',
    stranger.status >= 400,
    `status ${stranger.status} ${(stranger.body?.msg ?? stranger.body?.error_description ?? '').slice(0, 60)}`,
  );

  const student = await signUp(`verify-${Date.now()}@slrtce.in`);
  check(
    '@slrtce.in address is accepted',
    student.status === 200 && student.body?.id,
    `status ${student.status}`,
  );
  const studentId = student.body?.id;

  if (studentId) {
    const profile = await ADMIN`select role, email from public.profiles where id = ${studentId}`;
    check(
      'profile is auto-created with the trainer role',
      profile[0]?.role === 'trainer' && profile[0]?.email?.endsWith('@slrtce.in'),
      JSON.stringify(profile[0] ?? null),
    );
  }

  // ---------------------------------------------------------------------
  console.log('\nrow level security (anon is not staff)');
  for (const table of ['event_config', 'timeline_events', 'content_blocks']) {
    const res = await anonQuery(table);
    check(
      `anon can read ${table} (the landing page needs this)`,
      res.status === 200 && Array.isArray(res.body),
      `status ${res.status}`,
    );
  }

  for (const table of ['profiles', 'teams', 'registrations', 'submissions', 'allowed_emails']) {
    const res = await anonQuery(table);
    const denied =
      res.status === 200 ? (Array.isArray(res.body) ? res.body.length === 0 : true) : res.status === 401 || res.status === 403;
    check(
      `anon cannot read ${table}`,
      denied,
      `status ${res.status}${Array.isArray(res.body) ? ` rows ${res.body.length}` : ''}`,
    );
  }

  // ---------------------------------------------------------------------
  console.log('\nrow level security (a signed-in trainer is not staff)');
  // Sign up a fresh trainer and sign in as them, so the checks below run with a
  // real `authenticated` JWT and real RLS, not an approximation.
  const rlsTrainer = await signUp(`verify-rls-${Date.now()}@slrtce.in`);
  const rlsTrainerId = rlsTrainer.body?.id;
  const session = await signIn(rlsTrainer.body?.email ?? '');
  const accessToken = session.access_token ?? null;

  if (accessToken && rlsTrainerId) {
    const asUser = async (method, path, body) => {
      const res = await fetch(`${BASE}/rest/v1/${path}`, {
        method,
        headers: {
          apikey: KEY,
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      let parsed = null;
      try {
        parsed = await res.json();
      } catch {
        /* ignore */
      }
      return { status: res.status, body: parsed };
    };

    const profileRead = await asUser('GET', `profiles?id=eq.${rlsTrainerId}&select=id,role,email`);
    check(
      'trainer can read their own profile',
      profileRead.status === 200 && profileRead.body?.[0]?.email,
      `status ${profileRead.status}`,
    );

    // `studentId` is a *different* trainer, created above. Reading it proves
    // RLS is filtering by auth.uid() and not just returning whatever is asked for.
    const otherRead = await asUser('GET', `profiles?id=eq.${studentId}&select=id,email`);
    check(
      'trainer cannot read another trainer profile',
      otherRead.status === 200 && (otherRead.body?.length ?? 0) === 0,
      `rows ${otherRead.body?.length ?? 'n/a'}`,
    );

    const escalate = await asUser('PATCH', `profiles?id=eq.${rlsTrainerId}`, { role: 'admin' });
    const roleNow = await ADMIN`select role from public.profiles where id = ${rlsTrainerId}`;
    check(
      'trainer CANNOT promote themselves to admin',
      roleNow[0]?.role === 'trainer',
      `status ${escalate.status} role now ${roleNow[0]?.role}`,
    );

    const writeConfig = await asUser('PATCH', 'event_config?id=eq.1', { registration_open: false });
    const stillOpen = await ADMIN`select registration_open from public.event_config where id = 1`;
    check(
      'trainer cannot change the event countdown config',
      stillOpen[0].registration_open === true,
      `status ${writeConfig.status} registration_open=${stillOpen[0].registration_open}`,
    );

    const readTeamMembers = await asUser('GET', 'team_members?select=user_id');
    check(
      'trainer sees no other team members (no teams exist yet)',
      readTeamMembers.status === 200 && (readTeamMembers.body?.length ?? 0) === 0,
      `rows ${readTeamMembers.body?.length ?? 'n/a'}`,
    );
  } else {
    console.log(r('  SKIP  could not mint a trainer access token'));
    fail++;
  }
  // ---------------------------------------------------------------------
  console.log('\nrealtime + storage wiring');
  const pub = await ADMIN`
    select tablename from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' order by tablename`;
  const published = pub.map((p) => p.tablename);
  for (const t of ['event_config', 'timeline_events', 'content_blocks']) {
    check(`${t} is in the realtime publication`, published.includes(t));
  }

  const buckets = await ADMIN`select id, public, file_size_limit from storage.buckets order by id`;
  check(
    'submissions bucket exists and is PRIVATE',
    buckets.find((b) => b.id === 'submissions')?.public === false,
  );
  check('site-assets bucket exists and is public', buckets.find((b) => b.id === 'site-assets')?.public === true);

  // ---------------------------------------------------------------------
  console.log('\nseeded content');
  const cfg = await ADMIN`select event_name, tagline, countdown_target, venue, team_size_min from public.event_config`;
  check('event_config row exists', cfg.length === 1, cfg[0]?.event_name);
  check(
    'countdown target is 18 Oct 2026 12:00 IST',
    cfg[0]?.countdown_target?.toISOString() === '2026-10-18T06:30:00.000Z',
    cfg[0]?.countdown_target?.toISOString(),
  );
  const stops = await ADMIN`select count(*)::int as n from public.timeline_events`;
  check('timeline_events seeded', stops[0].n > 0, `${stops[0].n} stops`);

  // The expected block keys are the single source of truth in src/lib/content.ts.
  // Reading them out of the source means adding a section updates this check
  // automatically, instead of silently going stale like a hardcoded number does.
  const contentSource = fs.readFileSync(
    path.join(ROOT, 'src', 'lib', 'content.ts'),
    'utf8',
  );
  const expectedKeys = [
    ...new Set(
      [...contentSource.matchAll(/'(landing\.[a-z_]+)':/g)].map((m) => m[1]),
    ),
  ].sort();
  const blocks = await ADMIN`select key from public.content_blocks order by key`;
  const actualKeys = blocks.map((b) => b.key);
  check(
    `content_blocks has every key the app reads (${expectedKeys.length})`,
    expectedKeys.every((k) => actualKeys.includes(k)),
    actualKeys.join(', '),
  );

  const allow = await ADMIN`select email, grants_role from public.allowed_emails order by email`;
  check('allowlist seeded', allow.length >= 2, JSON.stringify(allow));

  await cleanup();

  console.log(`\n${fail === 0 ? g('all checks passed') : r(`${fail} failed`)} - ${pass} passed, ${fail} failed\n`);
  process.exitCode = fail === 0 ? 0 : 1;
}

main()
  .catch(async (err) => {
    console.error(r(`\nverify-rls crashed: ${err.message}`));
    if (process.env.DEBUG) console.error(err);
    try {
      await cleanup();
    } catch {
      /* best effort */
    }
    process.exitCode = 1;
  })
  .finally(() => ADMIN.end({ timeout: 5 }));
