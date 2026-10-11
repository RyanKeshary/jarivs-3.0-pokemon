-- =============================================================================
-- KENTO LEAGUE & INDIGO FEST · JARVIS 3.0
-- 0011_fix_security_and_linter_warnings.sql
-- Resolves all Supabase Database Linter & Security Advisor warnings:
-- 1. function_search_path_mutable:
--    - public.guard_profile_privileges
--    - public.handle_new_user
-- 2. rls_policy_always_true:
--    - Table public.fest_registrations: "Public insert fest_registrations"
--    - Table public.fest_teams: "Public insert fest_teams"
--    - Table public.fest_teams: "Public update fest_teams"
-- 3. anon_security_definer_function_executable & authenticated_security_definer_function_executable:
--    - Function public.is_registration_email_allowed(p_email text)
-- 4. rls_disabled_in_public:
--    - Table public.master_credentials (secure credentials table with RLS)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Fix function_search_path_mutable on trigger functions & revoke client access
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'guard_profile_privileges') THEN
    ALTER FUNCTION public.guard_profile_privileges() SET search_path = public, pg_temp;
    REVOKE ALL ON FUNCTION public.guard_profile_privileges() FROM PUBLIC, anon, authenticated;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') THEN
    ALTER FUNCTION public.handle_new_user() SET search_path = public, pg_temp;
    REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2. Drop / Revoke orphaned legacy function is_registration_email_allowed
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_registration_email_allowed') THEN
    REVOKE ALL ON FUNCTION public.is_registration_email_allowed(text) FROM PUBLIC, anon, authenticated;
    DROP FUNCTION public.is_registration_email_allowed(text);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3. Replace overly permissive RLS policies on fest_teams & fest_registrations
-- Server actions operate via postgres client / service role with BYPASSRLS,
-- so client roles (anon, authenticated) must not have unrestricted write access.
-- ---------------------------------------------------------------------------

-- 3.1 fest_teams
DROP POLICY IF EXISTS "Public insert fest_teams" ON public.fest_teams;
DROP POLICY IF EXISTS "Public update fest_teams" ON public.fest_teams;

DROP POLICY IF EXISTS "Admins can insert fest_teams" ON public.fest_teams;
CREATE POLICY "Admins can insert fest_teams"
ON public.fest_teams FOR INSERT TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update fest_teams" ON public.fest_teams;
CREATE POLICY "Admins can update fest_teams"
ON public.fest_teams FOR UPDATE TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete fest_teams" ON public.fest_teams;
CREATE POLICY "Admins can delete fest_teams"
ON public.fest_teams FOR DELETE TO authenticated
USING (public.is_admin());

-- 3.2 fest_registrations
DROP POLICY IF EXISTS "Public insert fest_registrations" ON public.fest_registrations;

DROP POLICY IF EXISTS "Admins can insert fest_registrations" ON public.fest_registrations;
CREATE POLICY "Admins can insert fest_registrations"
ON public.fest_registrations FOR INSERT TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update fest_registrations" ON public.fest_registrations;
CREATE POLICY "Admins can update fest_registrations"
ON public.fest_registrations FOR UPDATE TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete fest_registrations" ON public.fest_registrations;
CREATE POLICY "Admins can delete fest_registrations"
ON public.fest_registrations FOR DELETE TO authenticated
USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- 4. Enable RLS and isolate public.master_credentials
-- ---------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.master_credentials ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.master_credentials FROM anon, authenticated;

DROP POLICY IF EXISTS "Admins can manage master_credentials" ON public.master_credentials;
CREATE POLICY "Admins can manage master_credentials"
ON public.master_credentials FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());
