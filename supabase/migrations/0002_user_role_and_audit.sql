-- 0002_user_role_and_audit.sql
-- Add participant and master to user_role enum
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'participant';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'master';

-- Allow audit_log actor_id to be nullable for system operations
ALTER TABLE public.audit_log ALTER COLUMN actor_id DROP NOT NULL;
