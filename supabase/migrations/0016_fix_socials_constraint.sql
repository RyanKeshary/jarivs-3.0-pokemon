-- =============================================================================
-- 0016_fix_socials_constraint.sql
--
-- Fix profiles_socials_shape constraint so that default empty array '[]'::jsonb
-- passes validation on user registration.
-- =============================================================================

alter table public.profiles
  drop constraint if exists profiles_socials_shape;

alter table public.profiles
  add constraint profiles_socials_shape
  check (
    jsonb_typeof(socials) = 'array'
    and (
      jsonb_array_length(socials) = 0
      or (
        jsonb_path_query_array(socials, '$[*] ? (@.platform.type() != "string" || @.url.type() != "string")') = '[]'::jsonb
        and jsonb_path_query_array(socials, '$[*] ? (!(@.url like_regex "^https?://" flag "i"))') = '[]'::jsonb
      )
    )
  );
