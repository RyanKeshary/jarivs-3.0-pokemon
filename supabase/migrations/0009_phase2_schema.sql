-- =============================================================================
-- 0009_phase2_schema.sql
-- Phase 2 shape: trainer profiles, teams, submissions, announcements,
-- problem statements and resources.
--
-- Naming follows the Phase 2 spec rather than the Phase 1 drafts, so the columns
-- are renamed rather than duplicated. Renames preserve existing data; there is
-- none yet on a fresh project, but this keeps the migration safe to run on a
-- database that already has Phase 1 rows.
--
-- Everything unknown is NULLABLE and NULL means "not confirmed yet". The UI
-- renders an [EDIT ME] marker for NULL rather than inventing a value.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- allowed_emails: the exception list to the @slrtce.in rule
--
-- Replaces the Phase 1 `auth_allowlist`, which also supported username and
-- domain matching. Phase 2 only needs full addresses, and a full address is
-- unambiguous - `shrey.sleeps` in the Phase 1 seed would have matched that local
-- part on every domain, which is not what was intended.
-- ---------------------------------------------------------------------------
drop table if exists public.auth_allowlist;

create table public.allowed_emails (
  email       text             primary key
             check (email = lower(email) and position('@' in email) > 1),
  -- Role granted on first signup. NULL means "may register, but stay a trainer".
  grants_role public.user_role,
  note        text,
  added_by    uuid references auth.users (id) on delete set null,
  created_at  timestamptz      not null default now()
);

comment on table public.allowed_emails is
  'Emails permitted to register despite the @slrtce.in rule. grants_role is applied by the signup trigger.';

-- ---------------------------------------------------------------------------
-- profiles: trainer_id, contact details and socials
-- ---------------------------------------------------------------------------
create sequence if not exists public.trainer_id_seq as bigint start with 1 increment by 1;

alter table public.profiles
  add column if not exists trainer_id text,
  add column if not exists mobile    text,
  add column if not exists avatar    text,
  add column if not exists socials   jsonb not null default '[]'::jsonb;

-- Format guard, so a typo can never become a "trainer ID" that looks official.
alter table public.profiles
  drop constraint if exists profiles_trainer_id_format;
alter table public.profiles
  add constraint profiles_trainer_id_format
  check (trainer_id is null or trainer_id ~ '^KNT-[0-9]{4}-[0-9]{4,6}$');

-- E.164-ish: optional +, then 7-15 digits, ignoring spaces/dashes/parens.
-- Stored with formatting stripped so equality checks and unique indexes work.
alter table public.profiles
  drop constraint if exists profiles_mobile_format;
alter table public.profiles
  add constraint profiles_mobile_format
  check (mobile is null or mobile ~ '^\+?[1-9][0-9]{6,14}$');

-- The spec caps socials at 3. Enforced here, not in the form, so a direct API
-- call cannot bypass it.
alter table public.profiles
  drop constraint if exists profiles_socials_max_three;
alter table public.profiles
  add constraint profiles_socials_max_three
  check (jsonb_typeof(socials) = 'array' and jsonb_array_length(socials) <= 3);

-- Every entry must be an object with a platform and a URL, and the URL must be
-- absolute. `javascript:` and relative paths are rejected at the database.
alter table public.profiles
  drop constraint if exists profiles_socials_shape;
alter table public.profiles
  add constraint profiles_socials_shape
  check (
    socials @> '{}'::jsonb
    and jsonb_path_query_array(socials, '$[*] ? (@.platform.type() != "string" || @.url.type() != "string")') = '[]'::jsonb
    and jsonb_path_query_array(socials, '$[*].url ? (@ like_regex "^https?://" flag "i")') = socials
  );

create unique index if not exists profiles_trainer_id_unique
  on public.profiles (trainer_id)
  where trainer_id is not null;

-- The rest of Phase 1 is not in the Phase 2 spec. It is left in place rather
-- than dropped: it is real, nullable, and an admin may want it later. Dropping
-- columns is the one kind of migration that cannot be undone.
comment on column public.profiles.roll_no is 'Unused in Phase 2; kept for the Phase 3 registration form.';
comment on column public.profiles.year   is 'Unused in Phase 2; kept for the Phase 3 registration form.';
comment on column public.profiles.branch is 'Unused in Phase 2; kept for the Phase 3 registration form.';

-- ---------------------------------------------------------------------------
-- teams: human-facing team_id, join_code, leader, lock
-- ---------------------------------------------------------------------------
alter table public.teams rename column code to join_code;
alter table public.teams rename column captain_id to leader_id;

alter table public.teams
  add column if not exists team_id text,
  add column if not exists locked  boolean not null default false;

-- TEAM-XXXX and a 6-character join code. Both are read aloud and retyped, so
-- the alphabet drops 0/O/1/I.
alter table public.teams
  drop constraint if exists teams_code_format;
alter table public.teams
  drop constraint if exists teams_join_code_format;
alter table public.teams
  add constraint teams_team_id_format     check (team_id    is null or team_id    ~ '^TEAM-[A-Z0-9]{4}$'),
  add constraint teams_join_code_format check (join_code ~ '^[A-Z0-9]{6}$');

create unique index if not exists teams_team_id_unique on public.teams (team_id) where team_id is not null;

-- The Phase 1 index followed the old column name.
drop index if exists public.teams_captain_idx;
create index if not exists teams_leader_idx on public.teams (leader_id);

-- ---------------------------------------------------------------------------
-- team_members: is_leader naming
-- ---------------------------------------------------------------------------
alter table public.team_members rename column is_captain to is_leader;

-- ---------------------------------------------------------------------------
-- submissions: file_path / file_name / uploaded_at / version
-- ---------------------------------------------------------------------------
alter table public.submissions rename column deck_path to file_path;
alter table public.submissions rename column deck_file_name to file_name;

alter table public.submissions
  add column if not exists version     integer not null default 1,
  add column if not exists uploaded_at timestamptz not null default now();

-- Phase 2 does not ask for a title or abstract; the client sends the file name
-- instead. Relaxing NOT NULL keeps the upload path to a single insert.
alter table public.submissions alter column title drop not null;

alter table public.submissions
  drop constraint if exists submissions_version_positive;
alter table public.submissions
  add constraint submissions_version_positive check (version >= 1);

-- Storage object keys are "<team_id>/<something>.pptx". Enforced here so a row
-- can never point at a path outside its own team's folder.
alter table public.submissions
  drop constraint if exists submissions_file_path_shape;
alter table public.submissions
  add constraint submissions_file_path_shape
  check (file_path ~ ('^' || replace(team_id::text, '-', '') || '/[A-Za-z0-9._-]+\.(ppt|pptx|pdf)$'));

-- ---------------------------------------------------------------------------
-- announcements
-- ---------------------------------------------------------------------------
create table public.announcements (
  id         uuid        primary key default gen_random_uuid(),
  title      text        not null check (length(btrim(title)) > 0),
  body       text        not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Newest first is the only order the dashboard ever wants.
create index announcements_created_at_idx on public.announcements (created_at desc);

-- ---------------------------------------------------------------------------
-- problem_statements
-- ---------------------------------------------------------------------------
create table public.problem_statements (
  id          uuid        primary key default gen_random_uuid(),
  title       text        not null check (length(btrim(title)) > 0),
  description text        not null default '',
  -- Object key in the `problem-statements` bucket. NULL while being drafted.
  file_path   text,
  -- Trainers only ever see rows where this is true (RLS in 0011).
  visible     boolean     not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index problem_statements_visible_idx
  on public.problem_statements (visible, created_at desc);

-- ---------------------------------------------------------------------------
-- resources: brochure, template, and anything else staff publish later
-- ---------------------------------------------------------------------------
create table public.resources (
  id         uuid        primary key default gen_random_uuid(),
  -- The dashboard renders a fixed set of slots; `kind` is how a row claims one.
  kind       text        not null check (kind in ('brochure', 'ppt_template')),
  title      text        not null,
  description text       not null default '',
  -- Either a Storage object key or an absolute external URL.
  file_path  text,
  url        text,
  visible    boolean     not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- One row per slot: publishing a new brochure replaces the old row's link.
  constraint resources_one_per_kind unique (kind),
  -- A resource is only usable if it actually points somewhere.
  constraint resources_has_target check (file_path is not null or url is not null)
);

-- ---------------------------------------------------------------------------
-- updated_at triggers for the new tables
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['announcements', 'problem_statements', 'resources']
  loop
    execute format('drop trigger if exists trg_touch_%1$s on public.%1$I', t);
    execute format(
      'create trigger trg_touch_%1$s before update on public.%1$I
       for each row execute function public.touch_updated_at()', t);
  end loop;
end
$$;
