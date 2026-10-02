-- =============================================================================
-- 0001_bootstrap.sql
-- Internal bookkeeping schema, shared enums and the updated_at trigger helper.
-- Idempotent: safe to run against a database that already has some of this.
-- =============================================================================

-- Internal schema. Nothing here is exposed through PostgREST (which only serves
-- `public`), so the migration ledger can never be read or written by a client.
create schema if not exists kanto;

create table if not exists kanto.schema_migrations (
  name       text        primary key,
  checksum   text        not null,
  applied_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
-- `duplicate_object` fires when the type already exists, which is what we want
-- on a re-run. CREATE TYPE has no IF NOT EXISTS, so we need the exception block.
do $$
begin
  create type public.user_role as enum ('trainer', 'admin', 'manager');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.submission_status as enum ('draft', 'submitted', 'locked');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.allowlist_kind as enum ('email', 'username', 'domain');
exception
  when duplicate_object then null;
end
$$;

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
-- search_path is pinned to '' so this function can only ever resolve pg_catalog
-- objects. Anything else would be a search-path hijacking vector.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function public.touch_updated_at() is
  'Sets new.updated_at to now(). Attached as a BEFORE UPDATE trigger to every editable table.';
