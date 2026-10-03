-- 0004_flexible_join_code.sql
ALTER TABLE public.teams DROP CONSTRAINT IF EXISTS teams_join_code_format;
ALTER TABLE public.teams ADD CONSTRAINT teams_join_code_format 
  CHECK (join_code ~ '^[A-Za-z0-9\-]{6,12}$');
