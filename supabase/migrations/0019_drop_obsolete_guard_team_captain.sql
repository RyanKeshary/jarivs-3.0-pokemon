-- =============================================================================
-- 0019_drop_obsolete_guard_team_captain.sql
--
-- In 0009_phase2_schema.sql, teams.captain_id was renamed to leader_id.
-- The legacy trigger trg_guard_team_captain still referenced new.captain_id,
-- causing updates on public.teams to fail with "record new has no field captain_id".
-- =============================================================================

drop trigger if exists trg_guard_team_captain on public.teams;
drop function if exists public.guard_team_captain();
