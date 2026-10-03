-- =============================================================================
-- KENTO LEAGUE · JARVIS HACKATHON 3.0
-- 0005_fix_supabase_linter_warnings.sql
-- Resolves all Supabase Database Linter & Security Advisor errors and warnings:
-- 1. rls_disabled_in_public on public._migrations
-- 2. function_search_path_mutable on public functions
-- 3. rls_policy_always_true on public.audit_log
-- 4. rls_enabled_no_policy on public.registration_policy
-- 5. anon_security_definer_function_executable &
--    authenticated_security_definer_function_executable
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Enable RLS and isolate public._migrations
-- ---------------------------------------------------------------------------
ALTER TABLE IF EXISTS public._migrations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public._migrations FROM anon, authenticated;

DROP POLICY IF EXISTS "Admins can view migrations" ON public._migrations;
CREATE POLICY "Admins can view migrations"
ON public._migrations FOR SELECT TO authenticated
USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- 2. Drop obsolete / unused legacy RPC functions from prior iterations
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.create_team(text);
DROP FUNCTION IF EXISTS public.join_team(text);
DROP FUNCTION IF EXISTS public.leave_team();
DROP FUNCTION IF EXISTS public.my_team();
DROP FUNCTION IF EXISTS public.set_user_role(uuid, public.user_role);
DROP FUNCTION IF EXISTS public.set_user_role(uuid, text);
DROP FUNCTION IF EXISTS public.is_registration_email_allowed(text);
DROP FUNCTION IF EXISTS public.insert_audit_log(text, uuid, text, jsonb);
DROP FUNCTION IF EXISTS public.is_manager();

-- ---------------------------------------------------------------------------
-- 3. Secure Trigger Functions (REVOKE ALL from client roles anon & authenticated)
-- Triggers are invoked internally by PostgreSQL; client roles must NOT execute them.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'guard_locked_submission') THEN
    REVOKE ALL ON FUNCTION public.guard_locked_submission() FROM PUBLIC, anon, authenticated;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'guard_manager_privileges') THEN
    REVOKE ALL ON FUNCTION public.guard_manager_privileges() FROM PUBLIC, anon, authenticated;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'guard_profile_identity') THEN
    REVOKE ALL ON FUNCTION public.guard_profile_identity() FROM PUBLIC, anon, authenticated;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'guard_profile_privileges') THEN
    REVOKE ALL ON FUNCTION public.guard_profile_privileges() FROM PUBLIC, anon, authenticated;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'guard_team_identity') THEN
    REVOKE ALL ON FUNCTION public.guard_team_identity() FROM PUBLIC, anon, authenticated;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_auth_user') THEN
    REVOKE ALL ON FUNCTION public.handle_new_auth_user() FROM PUBLIC, anon, authenticated;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') THEN
    REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'trg_audit_log') THEN
    REVOKE ALL ON FUNCTION public.trg_audit_log() FROM PUBLIC, anon, authenticated;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_max_social_links') THEN
    REVOKE ALL ON FUNCTION public.check_max_social_links() FROM PUBLIC, anon, authenticated;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_team_size_limit') THEN
    REVOKE ALL ON FUNCTION public.check_team_size_limit() FROM PUBLIC, anon, authenticated;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 4. Fix function search paths and convert policy helpers to SECURITY INVOKER
-- Setting search_path prevents search_path injection attacks (0011).
-- SECURITY INVOKER ensures authenticated callers adhere to standard RLS (0028/0029).
-- ---------------------------------------------------------------------------

-- 4.1 is_admin()
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (role::text = 'admin' OR role::text = 'master' OR role::text = 'manager')
  );
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- 4.2 is_master()
CREATE OR REPLACE FUNCTION public.is_master()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (role::text = 'master' OR role::text = 'manager')
  );
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.is_master() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_master() TO authenticated;

-- 4.3 is_staff()
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (role::text IN ('admin', 'master', 'manager'))
  );
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.is_staff() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated;

-- 4.4 current_user_role()
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role AS $$
BEGIN
  RETURN (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.current_user_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;

-- 4.5 is_team_leader(p_team_id uuid)
CREATE OR REPLACE FUNCTION public.is_team_leader(p_team_id uuid)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.teams t WHERE t.id = p_team_id AND t.leader_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.is_team_leader(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_team_leader(uuid) TO authenticated;

-- 4.6 is_team_member(p_team_id uuid)
CREATE OR REPLACE FUNCTION public.is_team_member(p_team_id uuid)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_members m WHERE m.team_id = p_team_id AND m.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.is_team_member(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_team_member(uuid) TO authenticated;

-- 4.7 Fix mutable search path on ID generators
ALTER FUNCTION public.generate_trainer_id() SET search_path = public, pg_temp;
ALTER FUNCTION public.generate_team_id() SET search_path = public, pg_temp;
REVOKE ALL ON FUNCTION public.generate_trainer_id() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.generate_team_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.generate_trainer_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_team_id() TO authenticated;

-- 4.8 Fix mutable search path on trigger functions
DO $$
BEGIN
  ALTER FUNCTION public.handle_new_auth_user() SET search_path = public, pg_temp;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_max_social_links') THEN
    ALTER FUNCTION public.check_max_social_links() SET search_path = public, pg_temp;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_team_size_limit') THEN
    ALTER FUNCTION public.check_team_size_limit() SET search_path = public, pg_temp;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') THEN
    ALTER FUNCTION public.handle_new_user() SET search_path = public, pg_temp;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'guard_locked_submission') THEN
    ALTER FUNCTION public.guard_locked_submission() SET search_path = public, pg_temp;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'guard_manager_privileges') THEN
    ALTER FUNCTION public.guard_manager_privileges() SET search_path = public, pg_temp;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'guard_profile_identity') THEN
    ALTER FUNCTION public.guard_profile_identity() SET search_path = public, pg_temp;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'guard_profile_privileges') THEN
    ALTER FUNCTION public.guard_profile_privileges() SET search_path = public, pg_temp;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'guard_team_identity') THEN
    ALTER FUNCTION public.guard_team_identity() SET search_path = public, pg_temp;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'trg_audit_log') THEN
    ALTER FUNCTION public.trg_audit_log() SET search_path = public, pg_temp;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 5. Tighten audit_log INSERT policy (fix rls_policy_always_true)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated can insert audit log" ON public.audit_log;
CREATE POLICY "Authenticated can insert audit log"
ON public.audit_log FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL AND (actor_id IS NULL OR actor_id = auth.uid())
);

-- ---------------------------------------------------------------------------
-- 6. Add RLS policies for registration_policy (fix rls_enabled_no_policy)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Registration policy readable by authenticated" ON public.registration_policy;
CREATE POLICY "Registration policy readable by authenticated"
ON public.registration_policy FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "Registration policy manageable by admin" ON public.registration_policy;
CREATE POLICY "Registration policy manageable by admin"
ON public.registration_policy FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());
