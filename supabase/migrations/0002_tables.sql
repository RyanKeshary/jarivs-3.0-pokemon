-- =============================================================================
-- 0002_tables.sql
-- Every table the platform needs. No data in this file beyond structure.
--
-- Design notes
--  * Anything an admin is expected to change lives in a table, never in code.
--  * Columns we have not been told the real value for are NULLABLE on purpose.
--    The UI renders "[EDIT ME]" for NULL, which is honest about what is
--    unconfirmed instead of shipping an invented default.
--  * `profiles.team_id` is a denormalised convenience pointer; the authoritative
--    membership lives in `team_members` (one row per user, enforced by a unique
--    index) so a user can never be in two teams.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Event configuration (single row)
-- ---------------------------------------------------------------------------
create table public.event_config (
  id                    smallint    primary key default 1,
  -- id = 1 turns this into a singleton: you can never accidentally have two.
  constraint event_config_singleton check (id = 1),

  event_name            text        not null,
  tagline               text        not null,
  event_starts_at       timestamptz not null,
  -- What the landing page counts down to. Separate from event_starts_at so the
  -- countdown can be pointed at something else (a reveal, a deadline) later.
  countdown_target      timestamptz not null,
  registration_deadline timestamptz not null,
  -- Lets an admin close registration early without moving the deadline.
  registration_open     boolean     not null default true,

  -- Unconfirmed values: leave NULL and the UI shows [EDIT ME].
  venue                 text,
  team_size_min         smallint check (team_size_min is null or team_size_min >= 1),
  team_size_max         smallint check (team_size_max is null or team_size_max >= 1),

  updated_at            timestamptz not null default now(),
  updated_by            uuid references auth.users (id) on delete set null,

  constraint event_config_team_size_ordered
    check (team_size_min is null or team_size_max is null or team_size_max >= team_size_min)
);

-- ---------------------------------------------------------------------------
-- Editable landing-page copy, one row per section.
-- Keyed rows rather than columns so a new section needs no migration.
-- The JSON shape is documented in src/lib/content.ts and type-checked at read time.
-- ---------------------------------------------------------------------------
create table public.content_blocks (
  key        text        primary key,
  value      jsonb       not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

create index content_blocks_key_idx on public.content_blocks (key);

-- ---------------------------------------------------------------------------
-- Timeline ("route map") stops
-- ---------------------------------------------------------------------------
create table public.timeline_events (
  id          uuid        primary key default gen_random_uuid(),
  title       text        not null,
  description text,
  -- NULL means "time [EDIT ME]"; the card renders a placeholder instead of a date.
  starts_at   timestamptz,
  location    text,
  sort_order  smallint    not null default 0,
  is_highlight boolean    not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- NULLS FIRST so pinned stops (no date yet) still sort to the top of the route.
create index timeline_events_sort_idx
  on public.timeline_events (sort_order asc, starts_at asc nulls first);

-- ---------------------------------------------------------------------------
-- Teams
-- Declared before `profiles` because profiles.team_id points here.
-- ---------------------------------------------------------------------------
create table public.teams (
  id           uuid        primary key default gen_random_uuid(),
  name         text        not null,
  -- Short human-typable invite code, e.g. "KNT4-9QX".
  code         text        not null,
  captain_id   uuid references auth.users (id) on delete set null,
  max_members  smallint    not null default 4 check (max_members between 2 and 6),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint teams_code_format check (code ~ '^[A-Z0-9]{4}-[A-Z0-9]{3}$')
);

-- Case-insensitive uniqueness: "Rocket" and "rocket" must not both exist.
create unique index teams_name_unique_ci on public.teams (lower(name));
create index teams_captain_idx on public.teams (captain_id);

-- ---------------------------------------------------------------------------
-- Trainer profiles (one per auth user, created by the signup trigger)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id         uuid             primary key references auth.users (id) on delete cascade,
  email      text             not null,
  full_name  text             not null,
  roll_no    text,
  year       text,
  branch     text,
  role       public.user_role not null default 'trainer',
  team_id    uuid references public.teams (id) on delete set null,
  created_at timestamptz      not null default now(),
  updated_at timestamptz      not null default now()
);

create index profiles_role_idx on public.profiles (role);
create index profiles_team_idx on public.profiles (team_id);

-- ---------------------------------------------------------------------------
-- Team membership
-- ---------------------------------------------------------------------------
create table public.team_members (
  team_id    uuid        not null references public.teams (id) on delete cascade,
  user_id    uuid        not null references auth.users (id) on delete cascade,
  is_captain boolean     not null default false,
  joined_at  timestamptz not null default now(),
  primary key (team_id, user_id)
);

-- A trainer belongs to exactly one team. This unique index is the enforcement
-- mechanism - checking it in application code would be racy.
create unique index team_members_one_team_per_user on public.team_members (user_id);
create index team_members_team_idx on public.team_members (team_id);

-- ---------------------------------------------------------------------------
-- Event registrations
-- ---------------------------------------------------------------------------
create table public.registrations (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null unique references auth.users (id) on delete cascade,
  full_name  text        not null,
  email      text        not null,
  roll_no    text,
  year       text,
  branch     text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index registrations_email_idx on public.registrations (lower(email));

-- ---------------------------------------------------------------------------
-- Deck (PPT) submissions - one final deck per team
-- ---------------------------------------------------------------------------
create table public.submissions (
  id              uuid                  primary key default gen_random_uuid(),
  team_id         uuid                  not null references public.teams (id) on delete cascade,
  title           text                  not null,
  abstract        text,
  -- Storage object key inside the `submissions` bucket: "<team_id>/<file>".
  deck_path       text                  not null,
  deck_file_name  text                  not null,
  deck_mime_type  text                  not null,
  deck_size_bytes bigint                not null check (deck_size_bytes > 0),
  status          public.submission_status not null default 'draft',
  submitted_at    timestamptz,
  created_at      timestamptz            not null default now(),
  updated_at      timestamptz            not null default now(),

  -- One deck per team. Re-submitting updates the existing row.
  constraint submissions_one_per_team unique (team_id),
  -- A submission is only real once it has been submitted and timestamped.
  constraint submissions_submitted_has_timestamp
    check (status = 'draft' or submitted_at is not null)
);

create index submissions_status_idx on public.submissions (status);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'event_config', 'content_blocks', 'timeline_events',
    'teams', 'profiles', 'registrations', 'submissions'
  ]
  loop
    execute format('drop trigger if exists trg_touch_%1$s on public.%1$I', t);
    execute format(
      'create trigger trg_touch_%1$s before update on public.%1$I
       for each row execute function public.touch_updated_at()', t);
  end loop;
end
$$;
