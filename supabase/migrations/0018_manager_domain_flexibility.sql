-- =============================================================================
-- 0018_manager_domain_flexibility.sql
--
-- Ensure managers can register/login from any domain while restricting standard
-- registrations and admin roles strictly to @slrtce.in.
-- =============================================================================

create or replace function public.is_registration_email_allowed(p_email text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    coalesce(p_email, '') <> ''
    and (
      -- 1. an approved domain, e.g. *@slrtce.in
      exists (
        select 1
        from public.registration_policy rp,
             unnest(rp.allowed_domains) as d
        where lower(p_email) like '%@' || lower(d)
      )
      -- 2. an exact allowlisted address (e.g. external managers)
      or exists (
        select 1 from public.allowed_emails a where a.email = lower(p_email)
      )
      -- 3. an existing manager profile
      or exists (
        select 1 from public.profiles p where lower(p.email) = lower(p_email) and p.role = 'manager'
      )
    );
$$;

grant execute on function public.is_registration_email_allowed(text) to anon, authenticated;
