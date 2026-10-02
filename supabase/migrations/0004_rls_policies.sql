-- =============================================================================
-- 0004_rls_policies.sql
-- Roles live in the database and every read/write is gated by RLS. The frontend
-- hiding a button is a UX nicety, not a security control.
--
-- The helper functions are SECURITY DEFINER so that policies can read
-- `profiles` without recursing into the policies on `profiles` (RLS applies to
-- queries, including the ones inside another policy, unless the caller owns the
-- table - which the migration role does).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Role helpers
-- ---------------------------------------------------------------------------
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role from public.profiles p where p.id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_user_role() = 'admin', false);
$$;

create or replace function public.is_manager()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_user_role() = 'manager', false);
$$;

-- Admins and managers together are "staff": they run the event and may edit all
-- public content. Only admins may change roles or delete records.
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_user_role() in ('admin', 'manager'), false);
$$;

create or replace function public.is_team_member(p_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.team_members m where m.team_id = p_team_id and m.user_id = auth.uid()
  );
$$;

create or replace function public.is_team_captain(p_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.teams t where t.id = p_team_id and t.captain_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- Enable RLS everywhere. A table with RLS on and no policy denies everything.
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'event_config', 'content_blocks', 'timeline_events',
    'teams', 'profiles', 'team_members', 'registrations', 'submissions',
    'registration_policy', 'auth_allowlist'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end
$$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
-- Explicit rather than relying on Supabase's default privileges, so the
-- intent is readable and a project-level default change can't silently widen us.
grant usage on schema public to anon, authenticated;
grant select on public.event_config, public.content_blocks, public.timeline_events
  to anon, authenticated;
grant select, insert, update, delete on
  public.profiles, public.teams, public.team_members, public.registrations, public.submissions
  to authenticated;

-- The allowlist is the thing protecting registration. No client may read it.
revoke all on public.auth_allowlist from anon, authenticated;
revoke all on public.registration_policy from anon, authenticated;

-- The signup guard is a SECURITY DEFINER function; without EXECUTE nobody could
-- call it, and we want the client to be able to pre-check an address.
grant execute on function public.is_registration_email_allowed(text) to anon, authenticated;
grant execute on function public.current_user_role() to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_manager() to anon, authenticated;
grant execute on function public.is_staff() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- event_config / content_blocks / timeline_events : public reads, staff writes.
-- These three are also the realtime-published tables, and Realtime honours RLS,
-- so the anon SELECT policy above is what makes the live countdown work.
-- ---------------------------------------------------------------------------
create policy "event_config is public"
  on public.event_config for select
  to anon, authenticated
  using (true);

create policy "staff manage event_config"
  on public.event_config for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

create policy "content_blocks are public"
  on public.content_blocks for select
  to anon, authenticated
  using (true);

create policy "staff manage content_blocks"
  on public.content_blocks for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

create policy "timeline_events are public"
  on public.timeline_events for select
  to anon, authenticated
  using (true);

create policy "staff manage timeline_events"
  on public.timeline_events for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- ---------------------------------------------------------------------------
-- profiles : you see yourself, staff see everyone.
-- ---------------------------------------------------------------------------
create policy "read own profile"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()) or public.is_staff());

create policy "update own profile"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Role escalation guard. The UPDATE policy above would otherwise let a trainer
-- write `role = 'admin'` into their own row, because the policy only checks the
-- id. This trigger is the real control.
create or replace function public.guard_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Only an admin can change a role.'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_profile_privileges on public.profiles;
create trigger trg_guard_profile_privileges
  before update on public.profiles
  for each row execute function public.guard_profile_privileges();

-- Staff-only role changes go through the RPC below so the audit trail has one
-- entry point rather than N UPDATE statements.
create or replace function public.set_user_role(p_user_id uuid, p_role public.user_role)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only an admin can change roles.' using errcode = '42501';
  end if;
  if p_role = 'admin' and not public.is_admin() then
    raise exception 'Only an admin can promote someone to admin.' using errcode = '42501';
  end if;

  update public.profiles set role = p_role where id = p_user_id;
  if not found then
    raise exception 'No profile for that user.' using errcode = 'P0002';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- teams
-- ---------------------------------------------------------------------------
create policy "read own team"
  on public.teams for select
  to authenticated
  using (public.is_team_member(id) or public.is_staff());

create policy "captain creates own team"
  on public.teams for insert
  to authenticated
  with check (captain_id = (select auth.uid()));

create policy "captain or staff updates team"
  on public.teams for update
  to authenticated
  using (public.is_team_captain(id) or public.is_staff())
  with check (public.is_team_captain(id) or public.is_staff());

create policy "captain or staff deletes team"
  on public.teams for delete
  to authenticated
  using (public.is_team_captain(id) or public.is_staff());

-- Handing over captaincy to someone else is a staff action, not something a
-- captain can do to dodge the "captain leaves" cleanup.
create or replace function public.guard_team_captain()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.captain_id is distinct from old.captain_id
     and not public.is_staff()
     and new.captain_id is distinct from (select auth.uid()) then
    raise exception 'Only staff can hand a team to a different captain.'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_team_captain on public.teams;
create trigger trg_guard_team_captain
  before update on public.teams
  for each row execute function public.guard_team_captain();

-- ---------------------------------------------------------------------------
-- team_members
-- ---------------------------------------------------------------------------
create policy "read own memberships"
  on public.team_members for select
  to authenticated
  using (user_id = (select auth.uid()) or public.is_staff());

create policy "captain or staff adds members"
  on public.team_members for insert
  to authenticated
  with check (public.is_team_captain(team_id) or public.is_staff());

-- A member may remove themselves (leave); a captain or staff may remove anyone.
create policy "members or captain remove members"
  on public.team_members for delete
  to authenticated
  using (user_id = (select auth.uid()) or public.is_team_captain(team_id) or public.is_staff());

-- ---------------------------------------------------------------------------
-- registrations
-- ---------------------------------------------------------------------------
create policy "read own registration"
  on public.registrations for select
  to authenticated
  using (user_id = (select auth.uid()) or public.is_staff());

create policy "register self"
  on public.registrations for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "update own registration"
  on public.registrations for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "delete own registration"
  on public.registrations for delete
  to authenticated
  using (user_id = (select auth.uid()) or public.is_staff());

-- ---------------------------------------------------------------------------
-- submissions : visible to the team and to staff, written by the captain.
-- ---------------------------------------------------------------------------
create policy "team and staff read submissions"
  on public.submissions for select
  to authenticated
  using (public.is_team_member(team_id) or public.is_staff());

create policy "captain creates submission"
  on public.submissions for insert
  to authenticated
  with check (public.is_team_captain(team_id) or public.is_staff());

create policy "captain updates submission"
  on public.submissions for update
  to authenticated
  using (public.is_team_captain(team_id) or public.is_staff())
  with check (public.is_team_captain(team_id) or public.is_staff());

create policy "captain or staff deletes submission"
  on public.submissions for delete
  to authenticated
  using (public.is_team_captain(team_id) or public.is_staff());

-- Once a manager locks a deck, nobody but staff may change or remove it.
create or replace function public.guard_locked_submission()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status = 'locked' and not public.is_staff() then
    raise exception 'This deck has been locked by the organisers.'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_locked_submission on public.submissions;
create trigger trg_guard_locked_submission
  before update or delete on public.submissions
  for each row execute function public.guard_locked_submission();

-- ---------------------------------------------------------------------------
-- Team lifecycle RPCs.
-- These are SECURITY DEFINER because they touch several tables at once and need
-- to be atomic; each one re-checks authorisation internally.
-- ---------------------------------------------------------------------------
create or replace function public.create_team(p_name text, p_max_members smallint default 4)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_team_id uuid;
  v_code    text;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in.' using errcode = '42501';
  end if;
  if p_max_members < 2 or p_max_members > 6 then
    raise exception 'Team size must be between 2 and 6.' using errcode = '22023';
  end if;
  if exists (select 1 from public.team_members where user_id = auth.uid()) then
    raise exception 'You are already in a team. Leave it before creating another.'
      using errcode = '23505';
  end if;

  -- 6 chars of base32-ish alphabet, grouped as ABCD-EF. Readable aloud, hard to guess.
  v_code := upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 4))
            || '-'
            || upper(substr(encode(gen_random_bytes(2), 'hex'), 1, 3));

  insert into public.teams (name, code, captain_id, max_members)
  values (btrim(p_name), v_code, auth.uid(), p_max_members)
  returning id into v_team_id;

  insert into public.team_members (team_id, user_id, is_captain)
  values (v_team_id, auth.uid(), true);

  update public.profiles set team_id = v_team_id where id = auth.uid();

  return v_team_id;
end;
$$;

create or replace function public.join_team(p_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_team  public.teams;
  v_count integer;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in.' using errcode = '42501';
  end if;

  select * into v_team from public.teams where code = upper(btrim(p_code));
  if not found then
    raise exception 'No team matches that code.' using errcode = 'P0002';
  end if;

  if exists (select 1 from public.team_members where user_id = auth.uid()) then
    raise exception 'You are already in a team. Leave it before joining another.'
      using errcode = '23505';
  end if;

  select count(*) into v_count from public.team_members where team_id = v_team.id;
  if v_count >= v_team.max_members then
    raise exception 'That team is already full (%/%).', v_count, v_team.max_members
      using errcode = 'P0001';
  end if;

  insert into public.team_members (team_id, user_id) values (v_team.id, auth.uid());
  update public.profiles set team_id = v_team.id where id = auth.uid();

  return v_team.id;
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
  v_was_captain boolean;
  v_next       uuid;
begin
  select team_id into v_team_id from public.team_members where user_id = auth.uid();
  if v_team_id is null then
    return; -- not in a team: nothing to do, not an error
  end if;

  select captain_id = auth.uid() into v_was_captain from public.teams where id = v_team_id;

  delete from public.team_members where user_id = auth.uid();
  update public.profiles set team_id = null where id = auth.uid();

  if v_was_captain then
    -- Hand the badge to the longest-standing remaining member so the team and
    -- its deck are not orphaned.
    select user_id into v_next
    from public.team_members
    where team_id = v_team_id
    order by joined_at, user_id
    limit 1;

    if v_next is null then
      -- Last one out turns off the lights. Submissions cascade with the team.
      delete from public.teams where id = v_team_id;
    else
      update public.team_members set is_captain = true where team_id = v_team_id and user_id = v_next;
      update public.teams set captain_id = v_next where id = v_team_id;
    end if;
  end if;
end;
$$;

grant execute on function public.create_team(text, smallint) to authenticated;
grant execute on function public.join_team(text) to authenticated;
grant execute on function public.leave_team() to authenticated;
grant execute on function public.set_user_role(uuid, public.user_role) to authenticated;
grant execute on function public.is_team_member(uuid) to authenticated;
grant execute on function public.is_team_captain(uuid) to authenticated;
