-- =============================================================================
-- 0005_realtime_and_storage.sql
-- Realtime publication (live countdown) and the deck upload bucket.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------
-- These three tables are what the landing page subscribes to. Realtime honours
-- RLS, and migration 0004 gave anon SELECT on all three, so an admin editing
-- the countdown target in the dashboard updates every open tab with no refresh.
--
-- The publication is idempotent: adding a table that is already a member
-- raises, so we check membership first.
do $$
declare
  t text;
begin
  foreach t in array array['event_config', 'timeline_events', 'content_blocks']
  loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname    = 'supabase_realtime'
        and schemaname = 'public'
        and tablename  = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end
$$;

-- ---------------------------------------------------------------------------
-- Storage: deck submissions (private)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'submissions',
  'submissions',
  false,
  -- 50 MB. Big enough for a deck with embedded media, small enough that a
  -- student laptop over college wifi can still upload one.
  52428800,
  array[
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', -- .pptx
    'application/vnd.ms-powerpoint',                                             -- .ppt
    'application/pdf'
  ]
)
on conflict (id) do update
  set file_size_limit   = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types,
      public             = excluded.public;

-- ---------------------------------------------------------------------------
-- Storage: swappable site art (public)
-- ---------------------------------------------------------------------------
-- Placeholder art currently lives in the bundle. Anything an organiser wants to
-- publish at runtime (event posters, gym leader portraits) goes here and is
-- served from a public URL with no rebuild.
insert into storage.buckets (id, name, public, file_size_limit)
values ('site-assets', 'site-assets', true, 5242880)
on conflict (id) do update
  set public           = excluded.public,
      file_size_limit  = excluded.file_size_limit;

-- Only staff may publish art into site-assets.
create policy "staff uploads site assets"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'site-assets' and public.is_staff());

create policy "staff updates site assets"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'site-assets' and public.is_staff())
  with check (bucket_id = 'site-assets' and public.is_staff());

create policy "staff deletes site assets"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'site-assets' and public.is_staff());

-- ---------------------------------------------------------------------------
-- Storage: submissions objects
-- Object keys are "<team_id>/<file name>". The regex guard means a malformed
-- key is simply not visible instead of blowing up the policy with a cast error.
-- ---------------------------------------------------------------------------
create policy "team reads own deck"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'submissions'
    and (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and public.is_team_member(((storage.foldername(name))[1])::uuid)
  );

create policy "captain uploads deck"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'submissions'
    and (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and public.is_team_captain(((storage.foldername(name))[1])::uuid)
  );

create policy "captain replaces deck"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'submissions'
    and public.is_team_captain(((storage.foldername(name))[1])::uuid)
  )
  with check (
    bucket_id = 'submissions'
    and public.is_team_captain(((storage.foldername(name))[1])::uuid)
  );

create policy "captain or staff deletes deck"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'submissions'
    and (public.is_team_captain(((storage.foldername(name))[1])::uuid) or public.is_staff())
  );
