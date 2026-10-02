-- =============================================================================
-- 0003_auth_registration_guard.sql
-- Enforces "SLRTCE students only" in the DATABASE, not the frontend.
--
-- How the enforcement works
--  1. `public.registration_policy` is a singleton row listing the domains that
--     may sign up. The CHECK constraint guarantees it can never be emptied, so
--     deleting the row's contents cannot silently open registration to the world.
--  2. `public.auth_allowlist` is the escape hatch for explicitly invited people
--     who are not on an allowed domain. It matches on full email, on username
--     (the part before @) or on a whole domain.
--  3. `public.handle_new_user()` runs as an AFTER trigger on `auth.users`. If the
--     address fails both checks it raises, which aborts the entire signup
--     transaction - the auth user is never created. There is no code path where
--     an unapproved address exists in auth.users.
--
-- The same function also creates the `profiles` row, so a user can never exist
-- without a profile and a role.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Allowlisted domains
-- ---------------------------------------------------------------------------
create table public.registration_policy (
  id              smallint    primary key default 1,
  constraint registration_policy_singleton check (id = 1),

  allowed_domains text[]      not null,
  -- Belt and braces: cardinality() > 0 stops someone emptying the array and
  -- accidentally allowing every domain on earth.
  constraint registration_policy_not_empty check (cardinality(allowed_domains) > 0),

  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Explicit per-account allowlist
-- ---------------------------------------------------------------------------
create table public.auth_allowlist (
  id         uuid                 primary key default gen_random_uuid(),
  -- Full email, bare username ("shrey.sleeps") or bare domain, depending on kind.
  identifier text                 not null unique
             check (length(btrim(identifier)) > 0),
  kind       public.allowlist_kind not null,
  note       text,
  added_by   uuid references auth.users (id) on delete set null,
  created_at timestamptz          not null default now(),

  -- An 'email' row has to actually look like an email address.
  constraint auth_allowlist_email_shape check (
    kind <> 'email'
    or (identifier = lower(identifier) and position('@' in identifier) > 1)
  ),
  -- A 'domain' row must not carry an @ or a leading dot.
  constraint auth_allowlist_domain_shape check (
    kind <> 'domain' or (position('@' in identifier) = 0 and identifier !~ '^\.')
  )
);

-- ---------------------------------------------------------------------------
-- The single source of truth for "may this address sign up?"
-- ---------------------------------------------------------------------------
-- SECURITY DEFINER + search_path = '' : this reads tables the client roles have
-- no privileges on, and resolves only fully-qualified pg_catalog names.
create or replace function public.is_registration_email_allowed(p_email text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    coalesce(p_email, '') <> ''
    and (
      -- 1. approved domain, e.g. *@slrtce.in
      exists (
        select 1
        from public.registration_policy rp,
             unnest(rp.allowed_domains) as domain
        where lower(p_email) like '%@' || lower(domain)
      )
      -- 2. exact allowlisted address
      or exists (
        select 1 from public.auth_allowlist a
        where a.kind = 'email' and a.identifier = lower(p_email)
      )
      -- 3. allowlisted username, matched against the local part
      or exists (
        select 1 from public.auth_allowlist a
        where a.kind = 'username' and a.identifier = lower(split_part(p_email, '@', 1))
      )
      -- 4. allowlisted domain (covers bringing in a whole partner college)
      or exists (
        select 1 from public.auth_allowlist a
        where a.kind = 'domain'
          and lower(split_part(p_email, '@', 2)) like '%' || a.identifier
      )
    );
$$;

comment on function public.is_registration_email_allowed(text) is
  'Authorisation check for signup. Called by the auth trigger; also exposed to the client so the UI can fail fast with a friendly message.';

-- ---------------------------------------------------------------------------
-- Signup trigger: validate the address, then mint the profile.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_registration_email_allowed(new.email) then
    raise exception 'Registration is restricted to approved SLRTCE email domains.'
      using errcode = 'P0001',
            detail  = format('Rejected signup for %', coalesce(new.email, '(null)')),
            hint    = 'Use your @slrtce.in address, or ask an admin to add you to the allowlist.';
  end if;

  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    lower(new.email),
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

comment on function public.handle_new_user() is
  'Runs on every auth.users INSERT. Rejects unapproved domains outright and creates the trainer profile.';

-- AFTER INSERT, so the profile insert sees a committed parent row. Raising here
-- rolls the whole signup back.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Changing your email to an unapproved address must be blocked too, otherwise
-- the INSERT-time check would be trivially bypassed after signup.
drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- updated_at on the policy row
-- ---------------------------------------------------------------------------
drop trigger if exists trg_touch_registration_policy on public.registration_policy;
create trigger trg_touch_registration_policy
  before update on public.registration_policy
  for each row execute function public.touch_updated_at();
