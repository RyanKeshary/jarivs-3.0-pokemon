-- =============================================================================
-- 0010_phase2_functions.sql
-- Trainer ID generation, unique team codes, team capacity enforcement, and the
-- signup trigger rewritten for Phase 2 (trainer_id + allowlisted managers).
--
-- Everything here is SECURITY DEFINER with `search_path = ''`, so these
-- functions can write to tables the caller cannot, and can only resolve
-- fully-qualified names.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Drop the Phase 1 signatures before recreating them.
--
-- Postgres will not let CREATE OR REPLACE change a function's return type, and
-- three of these did change: create_team and join_team used to return a bare
-- uuid (which forced the client into a second round trip to fetch the row) and
-- now return the whole teams row. is_team_captain was renamed to is_team_leader
-- in the same pass.
--
-- Order matters twice over:
--   * several RLS policies embed is_team_captain() in their expressions, so they
--     have to go first or the DROP FUNCTION is refused;
--   * 0011's policies call the new is_team_leader() name, so this must run
--     before 0011.
-- The replacement policies are created in 0011 (tables) and 0012 (storage).
--
-- The affected policies are found by query rather than by name: there are seven
-- of them across four tables, and a name list would silently rot the next time
-- one is renamed.
-- ---------------------------------------------------------------------------
do $$
declare
  r record;
begin
  for r in
    select schemaname, tablename, policyname
    from pg_policies
    where qual like '%is_team_captain%'
       or with_check like '%is_team_captain%'
  loop
    execute format('drop policy %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end
$$;

drop function if exists public.create_team(text, smallint);
drop function if exists public.join_team(text);
drop function if exists public.leave_team();
drop function if exists public.set_user_role(uuid, public.user_role);
drop function if exists public.is_team_captain(uuid);
drop function if exists public.my_team();

-- ---------------------------------------------------------------------------
-- Trainer IDs: KNT-2026-0001
--
-- The year comes from the event's start date, not from "now", so every trainer
-- at this event gets the same prefix even if someone registers in 2027. The
-- counter is a sequence, which is concurrency-safe - a COUNT(*) based number
-- would hand two simultaneous signups the same ID.
-- ---------------------------------------------------------------------------
create or replace function public.next_trainer_id()
returns text
language sql
volatile
set search_path = ''
as $$
  select 'KNT-'
         || to_char(
              coalesce(
                (select ec.event_starts_at from public.event_config ec where ec.id = 1),
                now()
              ),
              'YYYY'
            )
         || '-'
         || lpad(nextval('public.trainer_id_seq')::text, 4, '0');
$$;

comment on function public.next_trainer_id() is
  'Allocates the next trainer ID, e.g. KNT-2026-0001. Unique by construction (sequence).';

-- ---------------------------------------------------------------------------
-- Team codes
--
-- Ambiguous glyphs are excluded (no 0/O, no 1/I) because these get read aloud
-- across a noisy hackathon room. The loop retries on the (very unlikely)
-- collision instead of failing, and gives up rather than spinning forever.
-- ---------------------------------------------------------------------------
create or replace function public.random_team_code(p_length integer)
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  v_code  text;
  v_tries integer := 0;
begin
  if p_length < 3 or p_length > 12 then
    raise exception 'Code length % is out of range', p_length using errcode = '22023';
  end if;

  loop
    select array_to_string(array_agg(
      substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + floor(random() * 32)::int, 1)
      order by g
    ), '')
    into v_code
    from generate_series(1, p_length) g;

    exit when not exists (select 1 from public.teams where join_code = v_code)
          and not exists (select 1 from public.teams where team_id = 'TEAM-' || v_code);
    v_tries := v_tries + 1;
    if v_tries > 50 then
      raise exception 'Could not generate a unique team code' using errcode = 'P0001';
    end if;
  end loop;

  return v_code;
end;
$$;

-- ---------------------------------------------------------------------------
-- Effective team size cap
--
-- event_config.team_size_max is the policy; teams.max_members is a per-team
-- override. Both are NULL-able because the size is still [EDIT ME].
--
-- If neither is set the cap falls back to 6, which is the hard ceiling enforced
-- by the teams_max_members_check constraint. Falling back to 6 rather than
-- "unlimited" means an unset value can never open the door to a hundred-person
-- team, and the UI shows [EDIT ME] so the gap is visible.
-- ---------------------------------------------------------------------------
create or replace function public.effective_team_cap(p_team_id uuid)
returns integer
language sql
stable
set search_path = ''
as $$
  select greatest(2, least(6,
    coalesce(
      (select ec.team_size_max from public.event_config ec where ec.id = 1),
      6
    ),
    coalesce((select t.max_members from public.teams t where t.id = p_team_id), 6)
  ));
$$;

-- ---------------------------------------------------------------------------
-- Team capacity + lock enforcement
--
-- Runs BEFORE INSERT on team_members. Two rules the spec asks for:
--   * a user may be in only one team  -> unique index on user_id (below)
--   * a team may not exceed the cap    -> this trigger
-- Counting is done under a lock on the parent team row, so two people joining
-- the last slot at the same moment cannot both succeed.
-- ---------------------------------------------------------------------------
create or replace function public.enforce_team_capacity()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_max    integer;
  v_count  integer;
  v_locked boolean;
begin
  select t.locked into v_locked
  from public.teams t
  where t.id = new.team_id
  for update;

  if not found then
    raise exception 'Team % does not exist', new.team_id using errcode = '23503';
  end if;

  if coalesce(v_locked, false) then
    raise exception 'This team is locked and no longer accepts members.'
      using errcode = '42501';
  end if;

  v_max := public.effective_team_cap(new.team_id);

  select count(*) into v_count
  from public.team_members m
  where m.team_id = new.team_id;

  if v_count >= v_max then
    raise exception 'That team is full (%/% members).', v_count, v_max
      using errcode = 'P0001',
            hint = 'Create your own team, or ask the leader for a slot.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_team_capacity on public.team_members;
create trigger trg_enforce_team_capacity
  before insert on public.team_members
  for each row execute function public.enforce_team_capacity();

create unique index if not exists team_members_one_team_per_user
  on public.team_members (user_id);

-- ---------------------------------------------------------------------------
-- Guard the identity columns
--
-- trainer_id and team_id are issued by the database. If a trainer could PATCH
-- their own row (the "edit my profile" policy allows that) they could hand
-- themselves a nicer-looking ID or collide with someone else's team.
-- ---------------------------------------------------------------------------
create or replace function public.guard_profile_identity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.trainer_id is distinct from old.trainer_id then
    raise exception 'trainer_id is assigned by the system and cannot be changed.'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_profile_identity on public.profiles;
create trigger trg_guard_profile_identity
  before update on public.profiles
  for each row execute function public.guard_profile_identity();

create or replace function public.guard_team_identity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.team_id is distinct from old.team_id then
    raise exception 'team_id is assigned by the system and cannot be changed.'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_team_identity on public.teams;
create trigger trg_guard_team_identity
  before update on public.teams
  for each row execute function public.guard_team_identity();

-- ---------------------------------------------------------------------------
-- Submission version bump
--
-- Re-uploading replaces the row; `version` counts replacements so a trainer can
-- see they are on v3 rather than wondering whether their latest file stuck.
-- ---------------------------------------------------------------------------
create or replace function public.bump_submission_version()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.file_path is distinct from old.file_path then
    new.version   := old.version + 1;
    new.uploaded_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_bump_submission_version on public.submissions;
create trigger trg_bump_submission_version
  before update on public.submissions
  for each row execute function public.bump_submission_version();

-- ---------------------------------------------------------------------------
-- Signup trigger, Phase 2
--
-- 1. Reject any address that is neither on an allowed domain nor allowlisted.
-- 2. Give allowlisted addresses their grants_role (managers, in our case).
-- 3. Mint a trainer_id.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(coalesce(new.email, ''));
  v_role  public.user_role;
begin
  if not public.is_registration_email_allowed(v_email) then
    raise exception 'Registration is restricted to approved SLRTCE email domains.'
      using errcode = 'P0001',
            detail  = format('Rejected signup for %', coalesce(new.email, '(null)')),
            hint    = 'Use your @slrtce.in address, or ask an admin to add you to allowed_emails.';
  end if;

  select a.grants_role into v_role from public.allowed_emails a where a.email = v_email;

  insert into public.profiles (id, email, full_name, trainer_id, role)
  values (
    new.id,
    v_email,
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
      split_part(v_email, '@', 1)
    ),
    public.next_trainer_id(),
    coalesce(v_role, 'trainer')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- The email-change guard from Phase 1 reuses this function, so it is recreated
-- only if it is missing (it was dropped with the table renames, not here).
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Team lifecycle RPCs, Phase 2
--
-- Atomic, and each re-checks authorisation internally. SECURITY DEFINER because
-- they touch several tables at once.
-- ---------------------------------------------------------------------------
create or replace function public.create_team(p_name text)
returns public.teams
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_team public.teams;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in.' using errcode = '42501';
  end if;

  if length(btrim(coalesce(p_name, ''))) < 2 then
    raise exception 'Give your team a name of at least 2 characters.' using errcode = '22023';
  end if;

  if exists (select 1 from public.team_members where user_id = auth.uid()) then
    raise exception 'You are already in a team. Leave it before creating another.'
      using errcode = '23505';
  end if;

  insert into public.teams (name, team_id, join_code, leader_id, max_members)
  values (
    btrim(p_name),
    'TEAM-' || public.random_team_code(4),
    public.random_team_code(6),
    auth.uid(),
    -- Start at the hard ceiling; effective_team_cap() applies the real policy.
    6
  )
  returning * into v_team;

  insert into public.team_members (team_id, user_id, is_leader) values (v_team.id, auth.uid(), true);

  update public.profiles set team_id = v_team.id where id = auth.uid();

  return v_team;
end;
$$;

create or replace function public.join_team(p_code text)
returns public.teams
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_team public.teams;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in.' using errcode = '42501';
  end if;

  select * into v_team
  from public.teams
  where join_code = upper(btrim(coalesce(p_code, '')));

  if not found then
    raise exception 'No team matches that code.' using errcode = 'P0002';
  end if;

  if exists (select 1 from public.team_members where user_id = auth.uid()) then
    raise exception 'You are already in a team. Leave it before joining another.'
      using errcode = '23505';
  end if;

  -- Capacity and lock are enforced by trg_enforce_team_capacity, so a full or
  -- locked team fails here with a real, translated error.
  insert into public.team_members (team_id, user_id) values (v_team.id, auth.uid());

  update public.profiles set team_id = v_team.id where id = auth.uid();

  return v_team;
end;
$$;

create or replace function public.leave_team()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_team_id    uuid;
  v_was_leader boolean;
  v_next       uuid;
begin
  select m.team_id into v_team_id
  from public.team_members m
  where m.user_id = auth.uid();

  if v_team_id is null then
    return; -- not in a team: nothing to do, not an error
  end if;

  select t.leader_id = auth.uid() into v_was_leader
  from public.teams t
  where t.id = v_team_id;

  delete from public.team_members where user_id = auth.uid();
  update public.profiles set team_id = null where id = auth.uid();

  if v_was_leader then
    -- Hand the badge to the longest-standing remaining member so the team and
    -- its deck are not orphaned.
    select m.user_id into v_next
    from public.team_members m
    where m.team_id = v_team_id
    order by m.joined_at, m.user_id
    limit 1;

    if v_next is null then
      -- Last one out turns off the lights. Submissions cascade with the team.
      delete from public.teams where id = v_team_id;
    else
      update public.team_members set is_leader = true
      where team_id = v_team_id and user_id = v_next;
      update public.teams set leader_id = v_next where id = v_team_id;
    end if;
  end if;
end;
$$;

-- Convenience read used by the dashboard: the signed-in user's team with its
-- members resolved. SECURITY DEFINER so one round trip replaces four.
create or replace function public.my_team()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'team', (
      select to_jsonb(t) - 'leader_id'
      from public.teams t
      where exists (select 1 from public.team_members m
                    where m.team_id = t.id and m.user_id = auth.uid())
    ),
    'members', coalesce((
      select jsonb_agg(jsonb_build_object(
               'user_id', m.user_id,
               'is_leader', m.is_leader,
               'joined_at', m.joined_at,
               'full_name', p.full_name,
               'trainer_id', p.trainer_id,
               'email', p.email,
               'avatar', p.avatar
             ) order by m.is_leader desc, m.joined_at)
      from public.team_members m
      join public.profiles p on p.id = m.user_id
      where exists (select 1 from public.team_members mine
                    where mine.team_id = m.team_id and mine.user_id = auth.uid())
    ), '[]'::jsonb)
  );
$$;

grant execute on function public.create_team(text) to authenticated;
grant execute on function public.join_team(text) to authenticated;
grant execute on function public.leave_team() to authenticated;
grant execute on function public.my_team() to authenticated;
grant execute on function public.next_trainer_id() to authenticated;
