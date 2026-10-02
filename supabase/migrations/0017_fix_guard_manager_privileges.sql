-- =============================================================================
-- 0017_fix_guard_manager_privileges.sql
--
-- Only enforce guard when role is actually changing.
-- =============================================================================

create or replace function public.guard_manager_privileges()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Only trigger if the role is actually being modified
  if old.role is distinct from new.role and exists (
    select 1 from public.profiles p2
    where p2.id = new.id
      and lower(split_part(p2.email, '@', 1)) in ('ryankeshary', 'shrey.sleeps')
  ) then
    if new.role != 'manager' then
      raise exception 'Cannot demote a protected manager.'
        using errcode = '42501';
    end if;

    if auth.uid() is not null and not public.is_admin() and not public.is_manager() then
      raise exception 'Only an admin or manager may change a protected manager''s role.'
        using errcode = '42501';
    end if;
  end if;

  return new;
end
$$;
