-- Auto confirm new auth users for SLRTCE college hackathon and master accounts
-- This ensures instant session creation upon signUp without blocking on SMTP verification

CREATE OR REPLACE FUNCTION public.auto_confirm_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.email_confirmed_at := COALESCE(NEW.email_confirmed_at, NOW());
  NEW.confirmed_at := COALESCE(NEW.confirmed_at, NOW());
  RETURN NEW;
END;
$$;

-- Revoke execution from public, anon, authenticated to satisfy Supabase security linter
REVOKE ALL ON FUNCTION public.auto_confirm_user() FROM PUBLIC, anon, authenticated;

-- Ensure trigger is active on auth.users before insert
DROP TRIGGER IF EXISTS trg_auto_confirm_user ON auth.users;
CREATE TRIGGER trg_auto_confirm_user
BEFORE INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.auto_confirm_user();
