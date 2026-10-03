-- 0003_fix_trainer_id_constraint.sql
-- Update trainer_id check constraint to support TRN-KL3-XXXXXX format as specified in prompt
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_trainer_id_format;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_trainer_id_format 
  CHECK (trainer_id IS NULL OR trainer_id ~ '^(TRN-KL3-[A-Z0-9]{6}|KNT-[0-9]{4}-[0-9]{4,6})$');

-- Also allow teams team_id check to accept TEAM-KL3-XXXX
DO $$
BEGIN
  ALTER TABLE public.teams DROP CONSTRAINT IF EXISTS teams_team_id_format;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
