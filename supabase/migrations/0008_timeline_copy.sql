-- =============================================================================
-- 0008_timeline_copy.sql
-- The route map's heading lived in component code while every other section's
-- copy came from content_blocks. This gives it a block of its own so an
-- organiser can retitle it without a deploy.
--
-- The stops themselves stay in the timeline_events table - this block is only
-- the eyebrow and heading above them.
-- =============================================================================

insert into public.content_blocks (key, value)
values (
  'landing.timeline',
  $$
{
  "eyebrow": "Timeline",
  "heading": "Your route to the badge"
}
$$::jsonb
)
on conflict (key) do nothing;
