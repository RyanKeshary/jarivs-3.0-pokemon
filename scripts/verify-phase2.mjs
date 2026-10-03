/**
 * Phase 2 verification: trainer registration, roles, teams, submissions.
 *
 * Like verify-rls.mjs, these are not unit tests. They run against the live
 * project and really attempt the operations that are supposed to fail, creating
 * throwaway auth users and deleting them at the end.
 *
 *   node scripts/verify-phase2.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import postgres from 'postgres';

import { ROOT, connectionOptions, describeTarget, loadEnv } from './lib/db.mjs';

loadEnv();

const ADMIN = postgres({ ...connectionOptions(), onnotice: () => {} });
const KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const SECRET = process.env.SUPABASE_SECRET_KEY;
const BASE = process.env.VITE_SUPABASE_URL;
const PASSWORD = 'Kanto-League-2026!';

if (!KEY || !SECRET || !BASE) {
  throw new Error('VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY and SUPABASE_SECRET_KEY are required');
}

let pass = 0;
let fail = 0;
const created = [];

const g = (s) => `\x1b[32m${s}\x1b[0m`;
const r = (s) => `\x1b[31m${s}\x1b[0m`;
const d = (s) => `\x1b[2m${s}\x1b[0m`;

function check(name, ok, detail = '') {
  if (ok) {
    pass++;
    console.log(`  ${g('PASS')}  ${name}${detail ? d(`  ${detail}`) : ''}`);
  } else {
    fail++;
    console.log(`  ${r('FAIL')}  ${name}${detail ? r(`  ${detail}`) : ''}`);
  }
}

const admin = (headers = {}, body, method = 'POST') =>
  fetch(`${BASE}/rest/v1/${headers.table ?? ''}`, { method, headers, body }).catch(() => null);

/** Creates a confirmed user through direct SQL with identity (bypasses admin HTTP token). */
async function makeUser(email) {
  try {
    const existing = await ADMIN`SELECT id, email FROM auth.users WHERE lower(email) = lower(${email}::text)`;
    if (existing.length > 0) {
      return { ok: true, status: 200, id: existing[0].id, email: existing[0].email };
    }

    const userId = (await ADMIN`SELECT gen_random_uuid() as id;`)[0].id;
    const fullName = `Probe ${email.slice(0, 6)}`;
    await ADMIN`
      INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data,
        confirmation_token, recovery_token, email_change_token_new, email_change,
        created_at, updated_at
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        ${userId}, 'authenticated', 'authenticated', ${email}::text,
        crypt(${PASSWORD}::text, gen_salt('bf', 10)),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('sub', ${userId}::text, 'email', ${email}::text, 'full_name', ${fullName}::text),
        '', '', '', '', now(), now()
      );
    `;
    await ADMIN`
      INSERT INTO auth.identities (
        id, user_id, provider_id, identity_data, provider, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), ${userId}, ${userId},
        jsonb_build_object('sub', ${userId}::text, 'email', ${email}::text, 'email_verified', true, 'phone_verified', false),
        'email', now(), now()
      );
    `;
    created.push(userId);
    return { ok: true, status: 200, id: userId, email };
  } catch (err) {
    return { ok: false, status: 500, id: null, email, error: err.message };
  }
}

/** A PostgREST client bound to one user's JWT, so RLS applies as it would in the app. */
async function asUser(token) {
  const headers = (extra = {}) => ({
    apikey: KEY,
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...extra,
  });
  return {
    get: async (path) => {
      const res = await fetch(`${BASE}/rest/v1/${path}`, { headers: headers() });
      return { status: res.status, body: await res.json().catch(() => null) };
    },
    post: async (path, body) => {
      const res = await fetch(`${BASE}/rest/v1/${path}`, {
        method: 'POST',
        headers: headers({ Prefer: 'return=representation' }),
        body: JSON.stringify(body),
      });
      return { status: res.status, body: await res.json().catch(() => null) };
    },
    patch: async (path, body) => {
      const res = await fetch(`${BASE}/rest/v1/${path}`, {
        method: 'PATCH',
        headers: headers({ Prefer: 'return=representation' }),
        body: JSON.stringify(body),
      });
      return { status: res.status, body: await res.json().catch(() => null) };
    },
    rpc: async (fn, args) => {
      const res = await fetch(`${BASE}/rest/v1/rpc/${fn}`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(args ?? {}),
      });
      return { status: res.status, body: await res.json().catch(() => null) };
    },
  };
}

async function signIn(email) {
  const pwd =
    email.toLowerCase() === 'ryankeshary@gmail.com' || email.toLowerCase() === 'shrey.sleeps@gmail.com'
      ? process.env.DEFAULT_ADMIN_PASSWORD || 'password@67'
      : PASSWORD;
  const res = await fetch(`${BASE}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: pwd }),
  });
  const body = await res.json().catch(() => ({}));
  return body.access_token ?? null;
}

async function cleanup() {
  try {
    await ADMIN`delete from public.teams where name ilike 'Probe Squad%' or name ilike 'Other%'`;
  } catch {
    /* best effort */
  }
  if (created.length === 0) return;
  await ADMIN`delete from auth.users where id = any(${created})`;
  console.log(d(`\ncleaned up ${created.length} throwaway auth user(s)`));
}

async function main() {
  const stamp = Date.now();
  console.log(d(`connected to ${describeTarget(connectionOptions())}\n`));

  // =====================================================================
  console.log('signup: trainer_id, roles, domain rule');
  const trainerEmail = `p2-trainer-${stamp}@slrtce.in`;
  const trainer = await makeUser(trainerEmail);
  check('trainer created via @slrtce.in', trainer.ok, `status ${trainer.status}`);

  const profile = (
    await ADMIN`select trainer_id, role, socials, mobile, avatar from public.profiles where id = ${trainer.id}`
  )[0];
  check(
    'trainer_id auto-generated in KNT-YYYY-NNNN form',
    /^KNT-\d{4}-\d{4,6}$/.test(profile?.trainer_id ?? ''),
    profile?.trainer_id,
  );
  check('role defaults to trainer', profile?.role === 'trainer', profile?.role);
  check('socials defaults to an empty array', JSON.stringify(profile?.socials) === '[]');

  // The two allowlisted organisers must land as managers, not trainers.
  const organiser = await makeUser('ryankeshary@gmail.com');
  check('allowlisted organiser created', organiser.ok, `status ${organiser.status}`);
  const organiserProfile = (
    await ADMIN`select role, trainer_id from public.profiles where id = ${organiser.id}`
  )[0];
  check(
    'allowlisted organiser gets role = manager (from allowed_emails.grants_role)',
    organiserProfile?.role === 'manager',
    organiserProfile?.role,
  );

  const secondOrganiser = await makeUser('shrey.sleeps@gmail.com');
  const secondRole = (
    await ADMIN`select role from public.profiles where id = ${secondOrganiser.id}`
  )[0]?.role;
  check('shrey.sleeps@gmail.com also gets manager', secondRole === 'manager', secondRole);

  const stranger = await makeUser(`p2-stranger-${stamp}@gmail.com`);
  check('non-allowlisted gmail is REJECTED by the database', !stranger.ok, `status ${stranger.status}`);

  // =====================================================================
  console.log('\nprofiles: constraints enforced in the database');
  const admin_ = await ADMIN;
  const socials3 = [
    { platform: 'github', url: 'https://github.com/x' },
    { platform: 'linkedin', url: 'https://linkedin.com/in/x' },
    { platform: 'x', url: 'https://x.com/x' },
  ];
  const socials4 = [...socials3, { platform: 'instagram', url: 'https://i.com/x' }];

  const threeOk = await admin_`
    update public.profiles set socials = ${admin_.json(socials3)} where id = ${trainer.id} returning socials`;
  check('3 socials accepted', threeOk.length === 1, `jsonb_array_length = ${threeOk[0]?.socials?.length ?? 0}`);

  let fourRejected = false;
  try {
    await admin_`update public.profiles set socials = ${admin_.json(socials4)} where id = ${trainer.id}`;
  } catch {
    fourRejected = true;
  }
  check('4 socials REJECTED by the CHECK constraint', fourRejected);

  let badUrlRejected = false;
  try {
    await admin_`update public.profiles set socials = ${admin_.json([{ platform: 'x', url: 'javascript:alert(1)' }])} where id = ${trainer.id}`;
  } catch {
    badUrlRejected = true;
  }
  check('javascript: social URL rejected', badUrlRejected);

  let badPhoneRejected = false;
  try {
    await admin_`update public.profiles set mobile = 'call-me-maybe' where id = ${trainer.id}`;
  } catch {
    badPhoneRejected = true;
  }
  check('non-numeric mobile rejected', badPhoneRejected);

  const goodPhone = await admin_`
    update public.profiles set mobile = '+919876543210' where id = ${trainer.id} returning mobile`;
  check('E.164 mobile accepted', goodPhone[0]?.mobile === '+919876543210', goodPhone[0]?.mobile);

  // A trainer must not be able to re-roll their own trainer_id.
  const trainerClient = await asUser(await signIn(trainerEmail));
  const idTamper = await trainerClient.patch(`profiles?id=eq.${trainer.id}`, { trainer_id: 'KNT-2026-9999' });
  const idAfter = (await admin_`select trainer_id from public.profiles where id = ${trainer.id}`)[0].trainer_id;
  check(
    'trainer CANNOT change their own trainer_id',
    idAfter === profile.trainer_id,
    `status ${idTamper.status}, still ${idAfter}`,
  );

  // =====================================================================
  console.log('\nteams: create, join, capacity, one-team-per-user');
  const createRes = await trainerClient.rpc('create_team', { p_name: `Probe Squad ${stamp}` });
  const team = createRes.body;
  check('create_team returns the team row', createRes.status === 200 && !!team?.id, `status ${createRes.status}`);
  check('team_id generated in TEAM-XXXX form', /^TEAM-[A-Z0-9]{4}$/.test(team?.team_id ?? ''), team?.team_id);
  check('join_code generated, 6 unambiguous chars', /^[A-Z0-9]{6}$/.test(team?.join_code ?? ''), team?.join_code);

  const myTeam = await trainerClient.rpc('my_team');
  check(
    'my_team() returns the team with its members',
    myTeam.status === 200 && myTeam.body?.team?.id === team.id && myTeam.body?.members?.length === 1,
    `members: ${myTeam.body?.members?.length}`,
  );
  check('creator is flagged as leader', myTeam.body?.members?.[0]?.is_leader === true);
  check('leader_id set on the team', (await admin_`select leader_id from public.teams where id = ${team.id}`)[0].leader_id === trainer.id);

  // Second trainer joins by code.
  const mateEmail = `p2-mate-${stamp}@slrtce.in`;
  const mate = await makeUser(mateEmail);
  const mateClient = await asUser(await signIn(mateEmail));
  const joinRes = await mateClient.rpc('join_team', { p_code: team.join_code });
  check('second trainer joins with the join_code', joinRes.status === 200 && joinRes.body?.id === team.id, `status ${joinRes.status}`);

  const badJoin = await mateClient.rpc('join_team', { p_code: 'ZZZZZZ' });
  check('joining with an unknown code fails', badJoin.status >= 400);

  // One team per user.
  const randTeamId = 'TEAM-' + Math.random().toString(36).slice(2, 6).toUpperCase();
  const otherTeam = (await admin_`insert into public.teams (name, team_id, join_code, leader_id, max_members)
    values (${'Other ' + stamp}, ${randTeamId}, ${'OTH' + Math.random().toString(36).slice(2, 5).toUpperCase()}, null, 6) returning id`)[0];
  let dualRejected = false;
  try {
    await admin_`insert into public.team_members (team_id, user_id) values (${otherTeam.id}, ${trainer.id})`;
  } catch {
    dualRejected = true;
  }
  check('a trainer cannot be in two teams (unique on user_id)', dualRejected);

  // Capacity: shrink the cap to 2, then try to add a third member.
  await admin_`update public.teams set max_members = 2 where id = ${team.id}`;
  const cap = (await admin_`select public.effective_team_cap(${team.id}) as cap`)[0].cap;
  check('effective_team_cap respects the team override', cap === 2, `cap = ${cap}`);
  const third = await makeUser(`p2-third-${stamp}@slrtce.in`);
  const thirdJoin = await asUser(await signIn(third.email));
  const overCap = await thirdJoin.rpc('join_team', { p_code: team.join_code });
  check('joining a FULL team is rejected by the trigger', overCap.status >= 400, overCap.body?.message?.slice(0, 70));
  await admin_`update public.teams set max_members = 6 where id = ${team.id}`;

  // Locked teams refuse new members.
  await admin_`update public.teams set locked = true where id = ${team.id}`;
  const lockedJoin = await thirdJoin.rpc('join_team', { p_code: team.join_code });
  check('joining a LOCKED team is rejected', lockedJoin.status >= 400, lockedJoin.body?.message?.slice(0, 60));
  await admin_`update public.teams set locked = false where id = ${team.id}`;

  // =====================================================================
  console.log('\nsubmissions: file paths, versioning, team isolation');
  const stranger2Email = `p2-outsider-${stamp}@slrtce.in`;
  const outsider = await makeUser(stranger2Email);
  const outsiderClient = await asUser(await signIn(stranger2Email));

  const goodPath = `${team.id}/v1/deck.pptx`;
  const sub = await trainerClient.post('submissions', {
    team_id: team.id,
    file_path: goodPath,
    file_name: 'deck.pptx',
    title: 'Probe deck',
  });
  check('team member uploads a submission row', sub.status === 201, `status ${sub.status}`);

  let escapePathRejected = false;
  try {
    await admin_`insert into public.submissions (team_id, file_path, file_name) values (${team.id}, 'someone-elses-team/deck.pptx', 'deck.pptx')`;
  } catch {
    escapePathRejected = true;
  }
  check('file_path outside the team folder is rejected', escapePathRejected);

  const bump = await admin_`
    update public.submissions set file_path = ${`${team.id}/v2/deck.pptx`}
    where team_id = ${team.id} returning version, uploaded_at`;
  check('replacing the file bumps version to 2', bump[0]?.version === 2, `version = ${bump[0]?.version}`);

  const outsiderRead = await outsiderClient.get('submissions?select=id');
  check(
    'a trainer on another team cannot read the submission',
    outsiderRead.status === 200 && (outsiderRead.body?.length ?? 0) === 0,
    `rows ${outsiderRead.body?.length ?? 'n/a'}`,
  );

  // =====================================================================
  console.log('\ndashboard content: RLS on announcements / statements / resources');
  const anonRead = await fetch(`${BASE}/rest/v1/announcements?select=id`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  });
  const anonBody = await anonRead.json().catch(() => null);
  check('anon cannot read announcements', anonRead.status !== 200 || (anonBody?.length ?? 0) === 0, `status ${anonRead.status}`);

  const anonStatements = await fetch(`${BASE}/rest/v1/problem_statements?select=id`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  });
  const anonStatementsBody = await anonStatements.json().catch(() => null);
  check('anon cannot read problem_statements', anonStatements.status !== 200 || (anonStatementsBody?.length ?? 0) === 0, `status ${anonStatements.status}`);

  // Staff publish one visible and one hidden statement.
  const managerClient = await asUser(await signIn('ryankeshary@gmail.com'));
  const hidden = (
    await managerClient.post('problem_statements', { title: 'Draft statement', visible: false })
  ).body?.[0];
  const shown = (
    await managerClient.post('problem_statements', { title: 'Published statement', visible: true })
  ).body?.[0];
  check('manager can publish a problem statement', !!hidden && !!shown);

  const trainerStatements = await trainerClient.get('problem_statements?select=title,visible&order=created_at');
  const titles = (trainerStatements.body ?? []).map((s) => s.title);
  check(
    'trainer sees ONLY visible problem statements',
    trainerStatements.status === 200 && titles.includes('Published statement') && !titles.includes('Draft statement'),
    titles.join(' | '),
  );

  const managerStatements = await managerClient.get('problem_statements?select=title&order=created_at');
  check(
    'manager sees both visible and draft statements',
    (managerStatements.body?.length ?? 0) >= 2,
    `${managerStatements.body?.length} rows`,
  );

  const trainerWrites = await trainerClient.post('announcements', { title: 'Trainer trying to post' });
  check('trainer CANNOT publish announcements', trainerWrites.status >= 400, `status ${trainerWrites.status}`);

  const managerAnnouncement = await managerClient.post('announcements', { title: 'Doors open at noon' });
  check('manager CAN publish announcements', managerAnnouncement.status === 201);

  const trainerReads = await trainerClient.get('announcements?select=title');
  check(
    'trainer can read announcements',
    trainerReads.status === 200 && (trainerReads.body?.length ?? 0) > 0,
    `${trainerReads.body?.length} rows`,
  );

  // =====================================================================
  console.log('\nleaving a team hands over the leader badge');
  await admin_`update public.teams set max_members = 6 where id = ${team.id}`;
  const leaveRes = await trainerClient.rpc('leave_team');
  const afterLeave = await admin_`select leader_id from public.teams where id = ${team.id}`;
  check('leader can leave', leaveRes.status === 200 || leaveRes.status === 204, `status ${leaveRes.status}`);
  check(
    'leadership passes to the longest-standing remaining member',
    afterLeave[0]?.leader_id === mate.id,
    afterLeave[0]?.leader_id === mate.id ? 'handed over' : 'still null or wrong',
  );
  const canRejoin = await trainerClient.rpc('join_team', { p_code: team.join_code });
  check('a trainer who left can now join another team', canRejoin.status === 200, `status ${canRejoin.status}`);

  // =====================================================================
  console.log('\nbuckets');
  const buckets = await admin_`select id, public, file_size_limit, allowed_mime_types from storage.buckets order by id`;
  const subs = buckets.find((b) => b.id === 'submissions');
  check('submissions bucket is private', subs?.public === false);
  check('submissions allows ppt/pptx/pdf', (subs?.allowed_mime_types ?? []).length === 3, JSON.stringify(subs?.allowed_mime_types));
  check('submissions has a size limit (50MB, [EDIT ME])', Number(subs?.file_size_limit) === 52428800, `${subs?.file_size_limit} bytes`);
  check('avatars bucket exists and is public', buckets.find((b) => b.id === 'avatars')?.public === true);
  check('problem-statements bucket exists', buckets.some((b) => b.id === 'problem-statements'));

  // =====================================================================
  console.log('\nrealtime publication');
  const pub = await admin_`
    select tablename from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' order by tablename`;
  const published = pub.map((p) => p.tablename);
  for (const t of ['announcements', 'problem_statements', 'resources', 'teams', 'team_members', 'submissions', 'profiles']) {
    check(`${t} is in the realtime publication`, published.includes(t));
  }

  // =====================================================================
  console.log('\napp expectations match the database');
  const types = fs.readFileSync(path.join(ROOT, 'src', 'lib', 'database.types.ts'), 'utf8');
  for (const col of ['trainer_id', 'mobile', 'avatar', 'socials']) {
    check(`database.types.ts declares profiles.${col}`, types.includes(col));
  }
  for (const col of ['team_id', 'join_code', 'leader_id', 'locked']) {
    check(`database.types.ts declares teams.${col}`, types.includes(col));
  }
  for (const col of ['file_path', 'file_name', 'uploaded_at', 'version']) {
    check(`database.types.ts declares submissions.${col}`, types.includes(col));
  }

  await cleanup();

  console.log(
    `\n${fail === 0 ? g('all checks passed') : r(`${fail} failed`)} - ${pass} passed, ${fail} failed\n`,
  );
  process.exitCode = fail === 0 ? 0 : 1;
}

main()
  .catch(async (err) => {
    console.error(r(`\nverify-phase2 crashed: ${err.message}`));
    if (process.env.DEBUG) console.error(err);
    try {
      await cleanup();
    } catch {
      /* best effort */
    }
    process.exitCode = 1;
  })
  .finally(() => ADMIN.end({ timeout: 5 }));
