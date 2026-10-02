-- =============================================================================
-- 0012_phase2_realtime_storage.sql
-- Realtime publication for the dashboard tables, the submissions bucket rules,
-- and a bucket for problem statements.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Realtime
--
-- The dashboard needs live team rosters, announcements and submission state.
-- `profiles` is included too: a teammate editing their name or avatar should
-- show up on the members list without a refresh.
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'announcements', 'problem_statements', 'resources',
    'teams', 'team_members', 'submissions', 'profiles'
  ]
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end
$$;

-- ---------------------------------------------------------------------------
-- submissions bucket
--
-- file_size_limit and allowed_mime_types are NOT YET CONFIRMED - the spec marks
-- them [EDIT ME]. These are working defaults; change them here when you decide.
-- The extension check in the policies below is the belt to that braces: a MIME
-- type can be spoofed by a client, a filename suffix cannot be spoofed past
-- this check without the server trusting it too.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'submissions',
  'submissions',
  false,
  52428800, -- 50 MB  [EDIT ME]
  array[
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', -- .pptx
    'application/vnd.ms-powerpoint',                                            -- .ppt
    'application/pdf'
  ]
)
on conflict (id) do update
  set file_size_limit   = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types,
      public             = excluded.public;

-- ---------------------------------------------------------------------------
-- problem-statements bucket: staff upload, every signed-in trainer reads
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('problem-statements', 'problem-statements', false, 26214400,
        array['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'])
on conflict (id) do update
  set file_size_limit   = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types,
      public             = excluded.public;

-- Object keys must be <team_id>/<file> for submissions. A single helper keeps
-- that regex in one place instead of copy-pasted into four policies.
create or replace function public.storage_path_is_team_scoped(p_name text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[A-Za-z0-9._-]+\.(ppt|pptx|pdf)$';
$$;

-- Rebuild the submission policies: the Phase 1 versions called
-- is_team_captain(), which no longer exists, and did not check the extension.
drop policy if exists "team reads own deck"          on storage.objects;
drop policy if exists "captain uploads deck"         on storage.objects;
drop policy if exists "captain replaces deck"        on storage.objects;
drop policy if exists "captain or staff deletes deck" on storage.objects;

create policy "team reads own deck"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'submissions'
    and public.storage_path_is_team_scoped(name)
    and public.is_team_member(((storage.foldername(name))[1])::uuid)
  );

create policy "team uploads deck"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'submissions'
    and public.storage_path_is_team_scoped(name)
    and public.is_team_member(((storage.foldername(name))[1])::uuid)
  );

-- Replacing a deck is a new object plus a delete of the old one, so this needs
-- to be allowed for any member of the team.
create policy "team replaces deck"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'submissions'
    and public.is_team_member(((storage.foldername(name))[1])::uuid)
  )
  with check (
    bucket_id = 'submissions'
    and public.storage_path_is_team_scoped(name)
    and public.is_team_member(((storage.foldername(name))[1])::uuid)
  );

create policy "team or staff deletes deck"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'submissions'
    and (public.is_team_member(((storage.foldername(name))[1])::uuid) or public.is_staff())
  );

-- ---------------------------------------------------------------------------
-- problem-statements objects
--
-- Reads are additionally gated on the row being published, so a drafted
-- statement is not reachable even if its path leaks into a client.
-- ---------------------------------------------------------------------------
drop policy if exists "trainers read published statements" on storage.objects;

create policy "trainers read published statements"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'problem-statements'
    and (
      public.is_staff()
      or exists (
        select 1 from public.problem_statements ps
        where ps.file_path = name and ps.visible
      )
    )
  );

create policy "staff manages problem statement files"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'problem-statements' and public.is_staff())
  with check (bucket_id = 'problem-statements' and public.is_staff());

-- ---------------------------------------------------------------------------
-- Avatar bucket
--
-- A trainer's avatar is a small public image; the URL goes in profiles.avatar.
-- Public so an <img> can render it without a signed URL dance.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152,
        array['image/png', 'image/jpeg', 'image/webp', 'image/avif'])
on conflict (id) do update
  set file_size_limit   = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types,
      public             = excluded.public;

-- Anyone signed in can upload an avatar into their own <user_id>/ folder.
create policy "trainers upload own avatar"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "trainers replace own avatar"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "trainers delete own avatar"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
