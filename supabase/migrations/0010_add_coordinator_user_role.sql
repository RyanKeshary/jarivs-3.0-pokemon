-- 0010_add_coordinator_user_role.sql
-- Add coordinator to user_role enum
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'coordinator';
