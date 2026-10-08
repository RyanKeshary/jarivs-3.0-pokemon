-- =============================================================================
-- INDIGO TECH FEST · JARVIS 3.0
-- 0008_indigo_fest_schema.sql
-- Editorial Vintage Natural History Print Tech Fest Schema
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.fest_events (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  description TEXT NOT NULL,
  day_label TEXT NOT NULL,
  days TEXT[] NOT NULL DEFAULT '{}',
  mode TEXT NOT NULL DEFAULT 'In-Person',
  slot_time TEXT NOT NULL,
  min_team_size INT NOT NULL DEFAULT 1,
  max_team_size INT NOT NULL DEFAULT 4,
  fee TEXT NOT NULL DEFAULT 'Free',
  capacity INT NOT NULL DEFAULT 60,
  deadline TIMESTAMPTZ NOT NULL DEFAULT '2026-10-15T23:59:59+05:30',
  is_open BOOLEAN NOT NULL DEFAULT TRUE,
  pokemon TEXT NOT NULL,
  rules TEXT[] NOT NULL DEFAULT '{}',
  rounds TEXT[] NOT NULL DEFAULT '{}',
  prize TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Fest Events
INSERT INTO public.fest_events (id, name, subtitle, description, day_label, days, mode, slot_time, min_team_size, max_team_size, fee, capacity, deadline, is_open, pokemon, rules, rounds, prize)
VALUES
(
  'project-exhibition',
  'Project Exhibition',
  'Technical Hardware & Software Showcase',
  'Display working prototypes and computational projects to academic adjudicators and industry peers.',
  'Day 1',
  ARRAY['Day 1'],
  'In-Person',
  '10:00 AM - 01:00 PM',
  1,
  4,
  'Free',
  50,
  '2026-10-15T23:59:59+05:30',
  TRUE,
  'eevee',
  ARRAY[
    'Each team must present a working demonstration or bench prototype.',
    'Projects must feature original engineering work and documented source files.',
    'A ten minute oral examination will follow each demonstration.'
  ],
  ARRAY[
    'Round 1: Preliminary Bench Review',
    'Round 2: Grand Jury Evaluation'
  ],
  'First Prize: ₹15,000 + Certificate of Distinction'
),
(
  'pid-geotto',
  'PID-geotto: Line Follower Robot',
  'Autonomous Line Following Speed Sprint',
  'Autonomous wheeled robotic vehicles navigate high curvature black and white tracks with calibrated PID control.',
  'Day 1',
  ARRAY['Day 1'],
  'In-Person',
  '01:30 PM - 04:30 PM',
  1,
  3,
  'Free',
  40,
  '2026-10-15T23:59:59+05:30',
  TRUE,
  'pikachu',
  ARRAY[
    'Robots must be fully autonomous with on-board computational units and power.',
    'Track width is 30mm with right-angle bends and crossover junctions.',
    'Three time trials permitted per bot with the lowest clean time recorded.'
  ],
  ARRAY[
    'Round 1: Qualifying Lap',
    'Round 2: Championship Fast Track'
  ],
  'First Prize: ₹12,000 + Trophy'
),
(
  'cad-mander',
  'Cad-Mander: AutoCAD Design',
  'Computer Aided Parametric Drafting Sprint',
  'Rapid drafting and 3D modeling under timed dimensional constraints spanning foundational blueprints to complex assemblies.',
  'Day 1 and Day 2',
  ARRAY['Day 1', 'Day 2'],
  'In-Person',
  '11:00 AM - 02:00 PM',
  1,
  2,
  'Free',
  35,
  '2026-10-15T23:59:59+05:30',
  TRUE,
  'gengar',
  ARRAY[
    'Official CAD workstations provided with standard modeling tools.',
    'Strict adherence to geometric tolerances and layer conventions.',
    'Day 1 scores dictate seeding into Day 2 parametric challenge.'
  ],
  ARRAY[
    'Day 1: Orthographic and Isometric Drafting',
    'Day 2: Parametric 3D Assembly & Stress Simulation'
  ],
  'First Prize: ₹10,000 + Gold Medal'
),
(
  'quiz-tle',
  'Quiz-tle: Technical Quiz',
  'Multi-Stage Technical Knowledge Tournament',
  'A rigorous examination of core computer systems, algorithms, natural sciences, and computational history.',
  'Day 1 and Day 2',
  ARRAY['Day 1', 'Day 2'],
  'In-Person',
  'Day 1 02:00 PM / Day 2 10:00 AM',
  2,
  2,
  'Free',
  60,
  '2026-10-15T23:59:59+05:30',
  TRUE,
  'psyduck',
  ARRAY[
    'Teams must strictly consist of exactly 2 members.',
    'No mobile devices or external references permitted during rounds.',
    'Top eight teams from Day 1 qualify for the Day 2 Grand Finale stage.'
  ],
  ARRAY[
    'Day 1: Written Prelims (Round 1) and Buzzer Eliminator (Round 2)',
    'Day 2: Grand Finale on Stage with Negative Marking (Round 3)'
  ],
  'First Prize: ₹10,000 + Rolling Trophy'
),
(
  'build-asor',
  'Build-asor: Buildathon',
  'Hybrid Engineering Endurance Sprint',
  'A grueling multi-phase software development crucible: Day 1 open network synthesis followed by Day 2 air-gapped local compilation.',
  'Day 1 and Day 2',
  ARRAY['Day 1', 'Day 2'],
  'Hybrid',
  'Day 1 10:00 AM / Day 2 09:00 AM',
  2,
  4,
  'Free',
  50,
  '2026-10-15T23:59:59+05:30',
  TRUE,
  'snorlax',
  ARRAY[
    'Day 1 allows full internet research, repository imports, and API integrations.',
    'Day 2 is strictly air-gapped without internet access to test fundamental execution.',
    'Teams must deploy verifiable local binaries or offline-capable bundles.'
  ],
  ARRAY[
    'Day 1: Problem Release & Connected Architecture Sprint',
    'Day 2: Offline Code Freeze, Hardening & Jury Review'
  ],
  'First Prize: ₹25,000 + Champion Shields'
),
(
  'reelax',
  'reelax: Reel Making',
  'Short-Form Digital Chronicle of the Fest',
  'Capture the kinetic atmosphere, technical tension, and spirit of Indigo Tech Fest in structured documentary short-form media.',
  'Day 1',
  ARRAY['Day 1'],
  'In-Person / Online',
  '10:00 AM - 05:00 PM',
  1,
  2,
  'Free',
  50,
  '2026-10-15T23:59:59+05:30',
  TRUE,
  'jigglypuff',
  ARRAY[
    'All footage must be captured on campus during Day 1 of the fest.',
    'Final edit runtime must strictly sit between 45 and 90 seconds.',
    'Evaluation on narrative pacing, color grading, sound design, and thematic fidelity.'
  ],
  ARRAY[
    'Round 1: Capture and Rough Cut Delivery',
    'Round 2: Audience Response and Jury Screening'
  ],
  'First Prize: ₹8,000 + Fest Laurels'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  subtitle = EXCLUDED.subtitle,
  description = EXCLUDED.description,
  day_label = EXCLUDED.day_label,
  days = EXCLUDED.days,
  mode = EXCLUDED.mode,
  slot_time = EXCLUDED.slot_time,
  min_team_size = EXCLUDED.min_team_size,
  max_team_size = EXCLUDED.max_team_size,
  pokemon = EXCLUDED.pokemon,
  rules = EXCLUDED.rules,
  rounds = EXCLUDED.rounds,
  prize = EXCLUDED.prize;

-- ---------------------------------------------------------------------------
-- Fest Teams Table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.fest_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  event_ids TEXT[] NOT NULL DEFAULT '{}',
  leader_email TEXT NOT NULL,
  leader_token TEXT UNIQUE NOT NULL,
  is_locked BOOLEAN NOT NULL DEFAULT FALSE,
  is_waitlist BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'Confirmed',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fest_teams_code ON public.fest_teams(code);
CREATE INDEX IF NOT EXISTS idx_fest_teams_leader_email ON public.fest_teams(leader_email);
CREATE INDEX IF NOT EXISTS idx_fest_teams_token ON public.fest_teams(leader_token);

-- ---------------------------------------------------------------------------
-- Fest Registrations (Participants) Table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.fest_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.fest_teams(id) ON DELETE CASCADE,
  team_code TEXT NOT NULL,
  is_leader BOOLEAN NOT NULL DEFAULT FALSE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  college TEXT NOT NULL,
  department TEXT NOT NULL,
  year_of_study TEXT NOT NULL,
  college_id TEXT,
  status TEXT NOT NULL DEFAULT 'Confirmed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fest_reg_team_id ON public.fest_registrations(team_id);
CREATE INDEX IF NOT EXISTS idx_fest_reg_email ON public.fest_registrations(email);
CREATE INDEX IF NOT EXISTS idx_fest_reg_phone ON public.fest_registrations(phone);

-- ---------------------------------------------------------------------------
-- Fest Announcements
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.fest_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed announcement
INSERT INTO public.fest_announcements (title, content, is_active)
SELECT 'Registrations Open for Indigo Tech Fest', 'Registration portals for Day 1 (16 Oct) and Day 2 (17 Oct) are now open. Team slots are allocated on a first-come basis.', TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.fest_announcements);

-- Update Event Settings for Indigo Tech Fest
UPDATE public.event_settings
SET
  name = 'INDIGO TECH FEST',
  tagline = 'Jarvis 3.0: An Editorial Tech Fest of Natural Inquiry and Algorithmic Craft',
  deadline = '2026-10-15T23:59:59+05:30',
  countdown_target = '2026-10-16T09:00:00+05:30',
  registration_deadline = '2026-10-15T23:59:59+05:30',
  landing_content = '{
    "venue": "Campus Grounds & Tech Pavilions",
    "organised_by": "Technical Council & Computing Society",
    "dates": "16 Oct 2026 - 17 Oct 2026",
    "manifesto": [
      "We gather beneath the deep indigo vault to test human skill against mechanical certainty.",
      "Here, algorithms are not merely executed; they are drafted with the meticulous discipline of ancient lithographs.",
      "Two days of relentless inquiry, autonomous design, and collaborative mastery await those who dare to enter."
    ],
    "timeline": [
      {"time": "09:00 AM", "title": "Inauguration and Keynote Address", "desc": "Official convocation in the Grand Amphitheatre.", "phase": "day1"},
      {"time": "10:00 AM", "title": "Project Exhibition and Build-asor Commences", "desc": "Hardware stalls live and Day 1 hybrid build begins.", "phase": "day1"},
      {"time": "11:00 AM", "title": "Cad-Mander Drafting Sprint 1", "desc": "First stage parametric modeling examination.", "phase": "day1"},
      {"time": "01:30 PM", "title": "PID-geotto Robotic Time Trials", "desc": "Autonomous line follower bots compete on the marked circuit.", "phase": "day1"},
      {"time": "02:00 PM", "title": "Quiz-tle Rounds 1 and 2", "desc": "Written qualification followed by rapid buzzer elimination.", "phase": "day1"},
      {"time": "05:00 PM", "title": "reelax Media Submissions Close", "desc": "Screening of short-form documentary entries.", "phase": "day1"},
      {"time": "09:00 AM", "title": "Build-asor Day 2: Air-Gapped Code Sprint", "desc": "Network lines disconnected. Pure offline algorithmic execution.", "phase": "day2"},
      {"time": "10:00 AM", "title": "Quiz-tle Grand Final (Round 3)", "desc": "The top eight qualifying duos battle on the auditorium stage.", "phase": "day2"},
      {"time": "11:00 AM", "title": "Cad-Mander Stage 2: Stress Simulation", "desc": "Advanced mechanical stress and thermal analysis modeling.", "phase": "day2"},
      {"time": "03:00 PM", "title": "Grand Valedictory and Prize Distribution", "desc": "Presentation of trophies, certificates, and fest laurels.", "phase": "day2"}
    ]
  }'::JSONB
WHERE id = 1;

-- Row Level Security policies
ALTER TABLE public.fest_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fest_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fest_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fest_announcements ENABLE ROW LEVEL SECURITY;

-- Anonymous and Authenticated read access
DROP POLICY IF EXISTS "Public read fest_events" ON public.fest_events;
CREATE POLICY "Public read fest_events" ON public.fest_events FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read fest_announcements" ON public.fest_announcements;
CREATE POLICY "Public read fest_announcements" ON public.fest_announcements FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read fest_teams limited" ON public.fest_teams;
CREATE POLICY "Public read fest_teams limited" ON public.fest_teams FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read fest_registrations limited" ON public.fest_registrations;
CREATE POLICY "Public read fest_registrations limited" ON public.fest_registrations FOR SELECT USING (true);

-- Allow public insert for registrations via server actions/functions
DROP POLICY IF EXISTS "Public insert fest_teams" ON public.fest_teams;
CREATE POLICY "Public insert fest_teams" ON public.fest_teams FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public insert fest_registrations" ON public.fest_registrations;
CREATE POLICY "Public insert fest_registrations" ON public.fest_registrations FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update fest_teams" ON public.fest_teams;
CREATE POLICY "Public update fest_teams" ON public.fest_teams FOR UPDATE USING (true);
