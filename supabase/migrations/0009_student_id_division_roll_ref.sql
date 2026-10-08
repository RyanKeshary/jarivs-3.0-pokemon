-- 0009_student_id_division_roll_ref.sql
-- Add explicit fields for division, roll number, and student reference ID

ALTER TABLE public.fest_registrations
  ADD COLUMN IF NOT EXISTS division text,
  ADD COLUMN IF NOT EXISTS roll_no text,
  ADD COLUMN IF NOT EXISTS reference_id text;
