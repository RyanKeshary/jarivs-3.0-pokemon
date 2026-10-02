-- =============================================================================
-- 0014_phase2_registration_check.sql
--
-- 0009 replaced the `auth_allowlist` table (which supported username and domain
-- matching) with `allowed_emails` (full addresses only). The Phase 1 function
-- `is_registration_email_allowed` still read the old table, so after 0009 it
-- raised "relation auth_allowlist does not exist" and every signup failed with
-- a 500.
--
-- This is a new migration rather than an edit to 0009/0010 because those are
-- already applied - rewriting history would make a fresh `db:push` produce a
-- different database than the live one.
--
-- The rule is unchanged in spirit: an approved domain OR an exact allowlisted
-- address. What changed is that the exception is now always a full email, so
-- there is no local-part or domain matching left to get wrong.
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
      -- 2. an exact allowlisted address
      or exists (
        select 1 from public.allowed_emails a where a.email = lower(p_email)
      )
    );
$$;

comment on function public.is_registration_email_allowed(text) is
  'Authorisation check for signup: approved domain OR exact address in allowed_emails. Called by the auth trigger and pre-checked by the client.';

-- Prove the function is callable for the roles that use it, so a missing GRANT
-- cannot silently turn into a 403 on the registration form.
grant execute on function public.is_registration_email_allowed(text) to anon, authenticated;
