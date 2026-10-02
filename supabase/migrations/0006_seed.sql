-- =============================================================================
-- 0006_seed.sql
-- The only rows the platform ships with. Everything here is meant to be edited
-- in the Supabase dashboard afterwards.
--
-- [EDIT ME] convention
--   Anything we were not told is stored as the literal string "[EDIT ME]" (for
--   text) or as NULL (for dates and numbers). The UI renders the [EDIT ME]
--   marker for both, so an unconfirmed value is visible rather than silently
--   invented. See the "Still to supply" table in README.md.
--
-- Idempotency
--   Every insert is guarded, so re-running this migration never duplicates rows
--   and never overwrites content an admin has since edited.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Who may register
-- ---------------------------------------------------------------------------
insert into public.registration_policy (id, allowed_domains)
values (1, array['slrtce.in'])
on conflict (id) do nothing;

-- Explicit exceptions to the domain rule, as requested.
--   ryankeshary@gmail.com -> full address
--   shrey.sleeps          -> matched against the part before the "@", so this
--                            row approves shrey.sleeps@ANY domain. If that is not
--                            what was meant, change kind to 'email' and put the
--                            full address in identifier.
insert into public.auth_allowlist (identifier, kind, note)
values
  ('ryankeshary@gmail.com', 'email',   'Organiser — outside the college domain'),
  ('shrey.sleeps',           'username', 'Organiser — approved by local part')
on conflict (identifier) do nothing;

-- ---------------------------------------------------------------------------
-- The single event row
-- ---------------------------------------------------------------------------
insert into public.event_config (
  id,
  event_name,
  tagline,
  event_starts_at,
  countdown_target,
  registration_deadline,
  registration_open,
  venue,
  team_size_min,
  team_size_max
)
values (
  1,
  'Kanto League – Jarvis Hackathon 3.0',
  'I chose Win.',
  timestamptz '2026-10-18T12:00:00+05:30',
  timestamptz '2026-10-18T12:00:00+05:30',
  timestamptz '2026-10-18T12:00:00+05:30',
  true,
  -- Unconfirmed. NULL renders as [EDIT ME] rather than an invented venue.
  null,
  null,
  null
)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Route map / timeline
-- Only the hackathon itself has a confirmed time. The rest stay NULL and show
-- "[EDIT ME]" until an organiser fills them in.
-- ---------------------------------------------------------------------------
insert into public.timeline_events (title, description, starts_at, location, sort_order, is_highlight)
select v.title, v.description, v.starts_at, v.location, v.sort_order, v.is_highlight
from (values
  ('Registration opens',
   'Sign up with your @slrtce.in email. Your trainer profile is created automatically.',
   null::timestamptz, '[EDIT ME] Online', 10, false),

  ('Teams form',
   'Create a team or join one with a 6-character invite code. Mixed-skill teams encouraged.',
   null::timestamptz, '[EDIT ME] Discord', 20, false),

  ('Submissions close',
   'Every captain uploads one deck (.pptx or .pdf) to the private submissions vault.',
   null::timestamptz, '[EDIT ME] Online', 30, false),

  ('The hackathon begins',
   'Doors open, brief is dropped, and the combined force assembles.',
   timestamptz '2026-10-18T12:00:00+05:30', '[EDIT ME] Venue', 40, true),

  ('Judging',
   'Gym leaders score every deck against the rubric.',
   null::timestamptz, '[EDIT ME] Venue', 50, false),

  ('Winners announced',
   'The badges are handed out. I chose Win.',
   null::timestamptz, '[EDIT ME] Venue', 60, true)
) as v(title, description, starts_at, location, sort_order, is_highlight)
where not exists (select 1 from public.timeline_events);

-- ---------------------------------------------------------------------------
-- Landing page copy
-- JSON shapes are documented (and type-checked) in src/lib/content.ts.
-- ---------------------------------------------------------------------------
insert into public.content_blocks (key, value)
values
-- Navbar anchors. `href` must match a section id rendered by the landing page
-- (#about, #details, #route) or the link will scroll nowhere.
('landing.navbar', $$
{
  "links": [
    { "label": "About",          "href": "#about" },
    { "label": "Event Details",  "href": "#details" },
    { "label": "Route",          "href": "#route" }
  ],
  "login_label": "Login",
  "register_label": "Register"
}
$$::jsonb),

('landing.hero', $$
{
  "kicker": "[EDIT ME] Season 01 · Track name",
  "primary_cta_label": "Register for the event",
  "secondary_cta_label": "View the route",
  "scroll_hint": "Scroll to begin your journey"
}
$$::jsonb),

('landing.about', $$
{
  "eyebrow": "About",
  "heading": "Not a normal hackathon.",
  "lede": "[EDIT ME] Two sentences on what makes Jarvis different from every other college hackathon.",
  "cards": [
    {
      "id": "not-normal",
      "title": "Not a normal hackathon",
      "body": "[EDIT ME] What is the one thing about this event that breaks the usual hackathon format?"
    },
    {
      "id": "combined-force",
      "title": "Combine your forces",
      "body": "[EDIT ME] Explain the combined-force concept: how teams are expected to pool different strengths and compete as one."
    },
    {
      "id": "gym-leaders",
      "title": "Gym leaders await",
      "body": "[EDIT ME] Name the gym leaders and say what each one is looking for.",
      "items": [
        { "label": "Gym Leader 1 — [EDIT ME]", "detail": "[EDIT ME] What this leader judges" },
        { "label": "Gym Leader 2 — [EDIT ME]", "detail": "[EDIT ME] What this leader judges" },
        { "label": "Gym Leader 3 — [EDIT ME]", "detail": "[EDIT ME] What this leader judges" },
        { "label": "[EDIT ME] Add or remove rows", "detail": "[EDIT ME]" }
      ]
    }
  ]
}
$$::jsonb),

-- `source` pulls the value from event_config so there is one place to edit a
-- date or a venue. `value` is used when source is null.
('landing.event_details', $$
{
  "eyebrow": "Event Details",
  "heading": "Starter Menu",
  "items": [
    { "id": "date",      "title": "Date & Time",       "source": "event_starts_at",       "value": null, "blurb": null },
    { "id": "venue",     "title": "Venue",             "source": "venue",                 "value": null, "blurb": null },
    { "id": "teams",     "title": "Team Size",         "source": "team_size",             "value": null, "blurb": null },
    { "id": "deadline",  "title": "Registrations Close", "source": "registration_deadline", "value": null, "blurb": null },
    { "id": "prizes",    "title": "Prizes",            "source": null, "value": "[EDIT ME] List the prizes and what each one is worth.", "blurb": null },
    { "id": "rules",     "title": "Rules",             "source": null, "value": "[EDIT ME] The rules of the event, and how a team is disqualified.", "blurb": null }
  ]
}
$$::jsonb),

('landing.final_cta', $$
{
  "heading": "Your journey begins",
  "body": "[EDIT ME] One line that pushes trainers to register before the deadline.",
  "primary_cta_label": "Register for the event"
}
$$::jsonb),

('landing.footer', $$
{
  "organised_by": "[EDIT ME] The club or department running this event",
  "contact_email": "[EDIT ME] contact@slrtce.in",
  "contact_phone": "[EDIT ME] +91 00000 00000",
  "copyright": "[EDIT ME] © 2026 [EDIT ME] All rights reserved.",
  "links": [
    { "label": "[EDIT ME] Link label", "href": "[EDIT ME] https://example.com" }
  ],
  "socials": [
    { "platform": "[EDIT ME] instagram", "url": "[EDIT ME] https://instagram.com/..." }
  ]
}
$$::jsonb)

on conflict (key) do nothing;
