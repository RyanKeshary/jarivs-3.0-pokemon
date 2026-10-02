-- =============================================================================
-- 0011_phase2_rls.sql
-- RLS for the Phase 2 tables, plus fixes for the Phase 1 policies that
-- referenced renamed columns.
--
-- Read paths by role:
--   anon            nothing private; only the landing-page tables
--   trainer         own profile, own team + its members, own team's submission,
--                   visible problem statements, visible resources, announcements
--   manager / admin everything
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Phase 1 functions that referenced the old column names
--
-- The old signatures were already dropped at the top of 0010; the Phase 1
-- storage policies that still referenced is_team_captain() are replaced in
-- 0012.
-- ---------------------------------------------------------------------------
create or replace function public.is_team_leader(p_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.teams t where t.id = p_team_id and t.leader_id = auth.uid()
  );
$$;

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
  update public.profiles set role = p_role where id = p_user_id;
  if not found then
    raise exception 'No profile for that user.' using errcode = 'P0002';
  end if;
end;
$$;

grant execute on function public.is_team_leader(uuid) to authenticated;
grant execute on function public.set_user_role(uuid, public.user_role) to authenticated;

-- ---------------------------------------------------------------------------
-- Enable RLS on the new tables
-- ---------------------------------------------------------------------------
alter table public.announcements         enable row level security;
alter table public.problem_statements   enable row level security;
alter table public.resources            enable row level security;
alter table public.allowed_emails       enable row level security;

-- profiles / teams / team_members / submissions had RLS from 0004; re-assert in
-- case a table was ever recreated.
alter table public.profiles      enable row level security;
alter table public.teams         enable row level security;
alter table public.team_members  enable row level security;
alter table public.submissions   enable row level security;

-- ---------------------------------------------------------------------------
-- Grants
--
-- allowed_emails is the thing guarding registration: staff manage it, nobody
-- else even sees that the table exists.
-- ---------------------------------------------------------------------------
grant select, insert, update, delete on
  public.profiles, public.teams, public.team_members, public.submissions
  to authenticated;
grant select on public.announcements, public.problem_statements, public.resources
  to authenticated;
grant select, insert, update, delete on public.allowed_emails to authenticated;
-- Reading the allowlist is a privilege. Managing it is staff-only.
revoke select on public.allowed_emails from anon, authenticated;

-- ---------------------------------------------------------------------------
-- announcements: any signed-in trainer can read; staff write
-- ---------------------------------------------------------------------------
create policy "trainers read announcements"
  on public.announcements for select
  to authenticated
  using (true);

create policy "staff manage announcements"
  on public.announcements for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- ---------------------------------------------------------------------------
-- problem_statements: trainers only see published rows
-- ---------------------------------------------------------------------------
create policy "trainers read visible problem statements"
  on public.problem_statements for select
  to authenticated
  using (visible or public.is_staff());

create policy "staff manage problem statements"
  on public.problem_statements for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- ---------------------------------------------------------------------------
-- resources: trainers see published rows; staff publish
-- ---------------------------------------------------------------------------
create policy "trainers read visible resources"
  on public.resources for select
  to authenticated
  using (visible or public.is_staff());

create policy "staff manage resources"
  on public.resources for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- ---------------------------------------------------------------------------
-- allowed_emails: staff only, in both directions
-- ---------------------------------------------------------------------------
create policy "staff read allowed emails"
  on public.allowed_emails for select
  to authenticated
  using (public.is_staff());

create policy "staff manage allowed emails"
  on public.allowed_emails for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- ---------------------------------------------------------------------------
-- profiles: add mobile / avatar / socials / trainer_id to the readable surface
--
-- The Phase 1 "update own profile" policy already allows a trainer to PATCH
-- their own row, which is what the Pokédex needs. trainer_id cannot be changed:
-- trg_guard_profile_identity raises if it is.
-- ---------------------------------------------------------------------------
drop policy if exists "read own profile" on public.profiles;
drop policy if exists "update own profile" on public.profiles;

create policy "read own profile"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()) or public.is_staff()
         -- teammates need names and avatars to render the members list
         or exists (
           select 1
           from public.team_members mine
           join public.team_members theirs on theirs.team_id = mine.team_id
           where mine.user_id = (select auth.uid()) and theirs.user_id = profiles.id
         ));

create policy "update own profile"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- teams: Phase 1 policy referenced captain_id via is_team_captain, which no
-- longer exists. Rebuild against the new column names.
-- ---------------------------------------------------------------------------
drop policy if exists "read own team" on public.teams;
drop policy if exists "captain creates own team" on public.teams;
drop policy if exists "captain or staff updates team" on public.teams;
drop policy if exists "captain or staff deletes team" on public.teams;

create policy "read own team"
  on public.teams for select
  to authenticated
  using (public.is_team_member(id) or public.is_staff());

-- Creation goes through the create_team() RPC so the team row, the membership
-- and the profile pointer are written in one transaction. This policy stays as
-- a safety net for a direct insert.
create policy "leader creates own team"
  on public.teams for insert
  to authenticated
  with check (leader_id = (select auth.uid()));

create policy "leader or staff updates team"
  on public.teams for update
  to authenticated
  using (public.is_team_leader(id) or public.is_staff())
  with check (public.is_team_leader(id) or public.is_staff());

-- Staff only: a team should not be deletable by a trainer, because submissions
-- cascade with it.
create policy "staff deletes team"
  on public.teams for delete
  to authenticated
  using (public.is_staff());

-- ---------------------------------------------------------------------------
-- team_members: insert is now driven by the RPCs and the capacity trigger
-- ---------------------------------------------------------------------------
drop policy if exists "read own memberships" on public.team_members;
drop policy if exists "captain or staff adds members" on public.team_members;
drop policy if exists "members or captain remove members" on public.team_members;

create policy "read own team members"
  on public.team_members for select
  to authenticated
  using (
    public.is_team_member(team_id) or public.is_staff()
    -- your own membership row, even if you are not yet on a team
    or user_id = (select auth.uid())
  );

create policy "leader or staff adds members"
  on public.team_members for insert
  to authenticated
  with check (public.is_team_leader(team_id) or public.is_staff());

-- A member may remove themselves (leave); a leader or staff may remove anyone.
create policy "members or leader remove members"
  on public.team_members for delete
  to authenticated
  using (
    user_id = (select auth.uid())
    or public.is_team_leader(team_id)
    or public.is_staff()
  );

-- ---------------------------------------------------------------------------
-- submissions: team reads and writes, staff lock
-- ---------------------------------------------------------------------------
drop policy if exists "team and staff read submissions" on public.submissions;
drop policy if exists "captain creates submission" on public.submissions;
drop policy if exists "captain updates submission" on public.submissions;
drop policy if exists "captain or staff deletes submission" on public.submissions;

create policy "team and staff read submissions"
  on public.submissions for select
  to authenticated
  using (public.is_team_member(team_id) or public.is_staff());

-- The spec says "only the team's members can upload/read their own path", so
-- every member may submit, not just the leader.
create policy "team creates submission"
  on public.submissions for insert
  to authenticated
  with check (public.is_team_member(team_id) or public.is_staff());

create policy "team updates submission"
  on public.submissions for update
  to authenticated
  using (public.is_team_member(team_id) or public.is_staff())
  with check (public.is_team_member(team_id) or public.is_staff());

-- Replacing a deck deletes the previous object, so only the team or staff.
create policy "team or staff deletes submission"
  on public.submissions for delete
  to authenticated
  using (public.is_team_member(team_id) or public.is_staff());
