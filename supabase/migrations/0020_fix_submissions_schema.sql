-- =============================================================================
-- 0020_fix_submissions_schema.sql
--
-- Relax submissions table deck_mime_type and deck_size_bytes constraints to be
-- optional in Phase 2, and support standard storage paths with hyphens and
-- optional version prefixes: "<team_id>[/v<version>]/<file>.(ppt|pptx|pdf)".
-- =============================================================================

alter table public.submissions
  alter column deck_mime_type drop not null,
  alter column deck_size_bytes drop not null;

alter table public.submissions
  drop constraint if exists submissions_deck_size_bytes_check;

alter table public.submissions
  add constraint submissions_deck_size_bytes_check
  check (deck_size_bytes is null or deck_size_bytes > 0);

alter table public.submissions
  drop constraint if exists submissions_file_path_shape;

alter table public.submissions
  add constraint submissions_file_path_shape
  check (
    file_path ~ ('^' || team_id::text || '(/v[0-9]+)?/[A-Za-z0-9._-]+\.(ppt|pptx|pdf)$')
    or file_path ~ ('^' || replace(team_id::text, '-', '') || '(/v[0-9]+)?/[A-Za-z0-9._-]+\.(ppt|pptx|pdf)$')
  );
