-- =============================================================================
-- 0013_phase2_seed.sql
-- Only the allowlist. It is the one Phase 2 row that has to exist for the
-- platform to behave correctly, because the signup trigger reads it.
--
-- `announcements`, `problem_statements` and `resources` are deliberately left
-- EMPTY. They are event content, not configuration, and inventing rows for them
-- would mean the dashboard showed fake announcements to real trainers. The UI
-- has proper empty states instead; staff fill these from the Supabase dashboard
-- or a future admin panel.
-- =============================================================================

insert into public.allowed_emails (email, grants_role, note)
values
  ('ryankeshary@gmail.com', 'manager', 'Organiser - outside the college domain'),
  ('shrey.sleeps@gmail.com', 'manager', 'Organiser - outside the college domain')
on conflict (email) do update
  set grants_role = excluded.grants_role,
      note        = excluded.note;

comment on table public.announcements is
  'Staff-authored updates shown in the dashboard. Intentionally empty on a fresh install.';
comment on table public.problem_statements is
  'Problem statements. Trainers only see rows with visible = true (RLS in 0011).';
comment on table public.resources is
  'One row per slot: brochure and ppt_template. A slot with no row means "not published yet" - the resources_has_target check means a row always points somewhere real.';
