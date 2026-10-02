-- =============================================================================
-- 0007_event_ends_at.sql
-- The countdown has to render three states: not started, in progress, and
-- ended. "Ended" needs a real timestamp, and rather than invent one we make the
-- column nullable - while it is NULL the UI shows the "[EDIT ME]" marker.
-- =============================================================================

alter table public.event_config
  add column if not exists event_ends_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'event_config_ends_after_start'
  ) then
    alter table public.event_config
      add constraint event_config_ends_after_start
      check (event_ends_at is null or event_ends_at >= event_starts_at);
  end if;
end
$$;

comment on column public.event_config.event_ends_at is
  'When the event finishes. NULL until confirmed; the countdown then cannot enter its "ended" state.';
