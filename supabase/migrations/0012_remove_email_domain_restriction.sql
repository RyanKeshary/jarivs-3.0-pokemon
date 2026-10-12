-- 0012_remove_email_domain_restriction.sql
-- Lift @slrtce.in domain restriction so that any valid email address can register as a participant

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  user_email TEXT;
  assigned_role TEXT := 'participant';
  t_id TEXT;
  full_name_val TEXT;
BEGIN
  user_email := LOWER(TRIM(NEW.email));

  -- Check if email is in master allowlist
  IF EXISTS (SELECT 1 FROM public.master_allowlist WHERE LOWER(email) = user_email) THEN
    assigned_role := 'master';
  END IF;

  t_id := public.generate_trainer_id();
  full_name_val := COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(user_email, '@', 1));

  INSERT INTO public.profiles (id, trainer_id, full_name, email, role)
  VALUES (NEW.id, t_id, full_name_val, user_email, assigned_role::public.user_role)
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    email = EXCLUDED.email;

  RETURN NEW;
END;
$$;

-- Revoke execution from public, anon, authenticated to satisfy Supabase security linter
REVOKE ALL ON FUNCTION public.handle_new_auth_user() FROM PUBLIC, anon, authenticated;
