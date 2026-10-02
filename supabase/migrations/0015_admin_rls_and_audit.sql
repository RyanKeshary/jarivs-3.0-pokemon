-- =============================================================================
-- 0015_admin_rls_and_audit.sql
-- Phase 3: Admin panel, manager hierarchy, and audit logging.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Ensure the user_role enum includes 'admin'
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('trainer', 'admin', 'manager');
  else
    if not exists (select 1 from pg_enum where enumlabel = 'admin' and enumtypid = 'public.user_role'::regtype) then
      alter type public.user_role add value 'admin';
    end if;
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- Audit log: every significant admin/manager action is recorded here.
-- ---------------------------------------------------------------------------
create table if not exists public.audit_log (
  id          uuid        primary key default gen_random_uuid(),
  actor_id    uuid        not null references auth.users (id) on delete set null,
  action      text        not null,              -- e.g. "promote_to_admin", "demote_to_trainer", "delete_team"
  target_id   uuid,       -- the team, profile, user, etc. affected
  target_type text,       -- "team", "profile", "admin", etc.
  details     jsonb,      -- free-form extra context
  created_at  timestamptz not null default now()
);

create index if not exists audit_log_actor_idx on public.audit_log (actor_id);
create index if not exists audit_log_created_idx on public.audit_log (created_at desc);
create index if not exists audit_log_target_idx on public.audit_log (target_id, target_type);

comment on table public.audit_log is
  'Logged admin/manager actions for accountability. Every INSERT is routed through public.insert_audit_log() trigger.';

-- ---------------------------------------------------------------------------
-- Trigger: auto-populate created_at and actor_id from session
-- ---------------------------------------------------------------------------
create or replace function public.trg_audit_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.actor_id := auth.uid();
  new.created_at := now();
  return new;
end
$$;

drop trigger if exists trg_audit_log on public.audit_log;
create trigger trg_audit_log
  before insert on public.audit_log
  for each row execute function public.trg_audit_log();

-- ---------------------------------------------------------------------------
-- Manager protection: managers (ryankeshary@gmail.com, shrey.sleeps@gmail.com)
-- cannot be demoted or have their role changed by anyone, including other managers.
-- This is enforced by a trigger on profiles.role.
-- ---------------------------------------------------------------------------
create or replace function public.guard_manager_privileges()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_is_manager boolean;
  v_actor_role public.user_role;
begin
  -- Determine the actor's role
  select p.role into v_actor_role
  from public.profiles p
  where p.id = auth.uid();

  -- Check if the target (being updated) is a manager
  -- We compare the NEW role against the current profile's known manager status
  -- The simplest approach: if old.role is 'manager' and new.role is different,
  -- and the actor is not another manager with higher privilege, block it.
  -- For now, we block ANY role change for profiles whose email local-part matches
  -- the two known manager usernames, regardless of who the actor is.

  -- Get the target profile's email to check against the allowlist
  -- We need to be careful: this function runs for every profile update,
  -- so we check if the profile being updated is one of the two managers.

  -- Check if the profile's email matches the known manager local parts
  -- ryankeshary -> ryankeshary@gmail.com
  -- shrey.sleeps -> shrey.sleeps@gmail.com
  if exists (
    select 1 from public.profiles p2
    where p2.id = new.id
      and lower(split_part(p2.email, '@', 1)) in ('ryankeshary', 'shrey.sleeps')
  ) then
    -- This is one of the two protected managers
    -- Only allow role change if the new role is still 'manager' and the actor IS a manager
    if new.role != 'manager' then
      raise exception 'Cannot demote a protected manager. Only another manager may change their role.'
        using errcode = '42501';
    end if;

    if not public.is_admin() and not public.is_manager() then
      raise exception 'Only an admin or manager may change a protected manager''s role.'
        using errcode = '42501';
    end if;
  end if;

  return new;
end
$$;

drop trigger if exists trg_guard_manager_privileges on public.profiles;
create trigger trg_guard_manager_privileges
  before update on public.profiles
  for each row execute function public.guard_manager_privileges();

-- ---------------------------------------------------------------------------
-- Grant: authenticated can read audit log (for admin features)
-- ---------------------------------------------------------------------------
grant select on public.audit_log to authenticated;

-- ---------------------------------------------------------------------------
-- Convenience: insert into audit log (used by RPCs)
-- ---------------------------------------------------------------------------
create or replace function public.insert_audit_log(
  p_action text,
  p_target_id uuid,
  p_target_type text,
  p_details jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.audit_log (actor_id, action, target_id, target_type, details)
  values (auth.uid(), p_action, p_target_id, p_target_type, p_details);
end;
$$;

grant execute on function public.insert_audit_log to authenticated;