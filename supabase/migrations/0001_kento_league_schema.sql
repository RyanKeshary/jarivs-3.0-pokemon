-- =============================================================================
-- KENTO LEAGUE · JARVIS HACKATHON 3.0
-- 0001_kento_league_schema.sql
-- Harmonized schema supporting all prompt specifications seamlessly
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- 1. Master Allowlist
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.master_allowlist (
  email TEXT PRIMARY KEY,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.master_allowlist (email, notes)
VALUES 
  ('ryankeshary@gmail.com', 'Master Organizer'),
  ('shrey.sleeps@gmail.com', 'Master Organizer')
ON CONFLICT (email) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. Event Settings (single row)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.event_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  name TEXT NOT NULL DEFAULT 'Kento League · Jarvis Hackathon 3.0',
  tagline TEXT NOT NULL DEFAULT 'Where Code Meets the Pokémon League — Build, Battle, and Level Up!',
  deadline TIMESTAMPTZ NOT NULL DEFAULT '2026-10-18T18:00:00+05:30',
  countdown_target TIMESTAMPTZ NOT NULL DEFAULT '2026-10-18T09:00:00+05:30',
  registration_deadline TIMESTAMPTZ NOT NULL DEFAULT '2026-10-17T23:59:59+05:30',
  min_team_size INT NOT NULL DEFAULT 1,
  max_team_size INT NOT NULL DEFAULT 4,
  brochure_url TEXT DEFAULT '/assets/placeholders/brochure.pdf',
  ppt_template_url TEXT DEFAULT '/assets/placeholders/template.pptx',
  landing_content JSONB NOT NULL DEFAULT '{
    "venue": "SLRTCE Campus, Mira Road, Mumbai / Virtual Hybrid Arena",
    "prizes": [
      {"place": "1st Place (Champion)", "amount": "₹50,000 + Trophy + PokeBall Swag Pack"},
      {"place": "2nd Place (Elite Four)", "amount": "₹25,000 + Medal + Tech Goodies"},
      {"place": "3rd Place (Gym Leader)", "amount": "₹15,000 + Certificate + Perks"}
    ],
    "tracks": [
      {"name": "AI & GenAI Battle Arena", "desc": "Agentic systems, LLM copilots, automated battle intelligences."},
      {"name": "Web3 & Decentralized Gyms", "desc": "Smart contracts, on-chain trainer badges, verifiable credentials."},
      {"name": "IoT & Smart Poké-Devices", "desc": "Hardware hacks, edge devices, smart campus sensors."},
      {"name": "Open Innovation", "desc": "High impact solutions for real-world municipal & collegiate challenges."}
    ],
    "rules": [
      "All code must be written during the hackathon hours.",
      "Teams can comprise 1 to 4 trainers with an active @slrtce.in domain.",
      "Plagiarism or pre-built code will result in immediate disqualification.",
      "Submissions require a presentation PPT/PDF and GitHub repository."
    ],
    "eligibility": "Open to all engineering students with an active @slrtce.in institutional email id.",
    "timeline": [
      {"time": "09:00 AM", "title": "Opening Ceremony & Keynote", "desc": "Pallet Town Kickoff at the Main Auditorium", "phase": "day1"},
      {"time": "10:30 AM", "title": "Hackathon Begins & Problem Release", "desc": "Gym Battles Open! Teams start building", "phase": "day1"},
      {"time": "01:00 PM", "title": "Mid-Day Energy Fuel", "desc": "Lunch & Poké-Snack breaks", "phase": "day1"},
      {"time": "05:00 PM", "title": "Mentorship Checkpoint 1", "desc": "Professor Oak reviews trainer progress", "phase": "day1"},
      {"time": "11:00 PM", "title": "Midnight Mini-Challenge", "desc": "Speed coding mini-battle for bonus swag", "phase": "day1"},
      {"time": "08:00 AM", "title": "Morning Checkpoint 2", "desc": "Final sprint & debugging round", "phase": "day2"},
      {"time": "02:00 PM", "title": "Submission Lock", "desc": "All PPT and code repos locked for judging", "phase": "day2"},
      {"time": "04:30 PM", "title": "Grand Finale & Champion Crowning", "desc": "League Champions announced and prizes awarded", "phase": "day2"}
    ]
  }'::JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.event_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. Profiles modifications
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trainer_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT '/assets/placeholders/monitor.png';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phones TEXT[] NOT NULL DEFAULT '{}';

-- ---------------------------------------------------------------------------
-- 4. Social Links (Max 3 per user)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.social_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.check_max_social_links()
RETURNS TRIGGER AS $$
DECLARE
  count_links INT;
BEGIN
  SELECT COUNT(*) INTO count_links FROM public.social_links WHERE user_id = NEW.user_id;
  IF count_links >= 3 THEN
    RAISE EXCEPTION 'A trainer can have a maximum of 3 social links.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_social_links ON public.social_links;
CREATE TRIGGER trg_check_social_links
BEFORE INSERT ON public.social_links
FOR EACH ROW EXECUTE FUNCTION public.check_max_social_links();

-- ---------------------------------------------------------------------------
-- 5. Teams modifications
-- ---------------------------------------------------------------------------
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
UPDATE public.teams SET created_by = leader_id WHERE created_by IS NULL AND leader_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 6. Team Members limit trigger
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_team_size_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_size INT;
  max_allowed INT;
BEGIN
  SELECT max_team_size INTO max_allowed FROM public.event_settings WHERE id = 1;
  IF max_allowed IS NULL THEN
    max_allowed := 4;
  END IF;

  SELECT COUNT(*) INTO current_size FROM public.team_members WHERE team_id = NEW.team_id;
  IF current_size >= max_allowed THEN
    RAISE EXCEPTION 'Team has reached maximum capacity of % trainers.', max_allowed;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_team_size ON public.team_members;
CREATE TRIGGER trg_check_team_size
BEFORE INSERT ON public.team_members
FOR EACH ROW EXECUTE FUNCTION public.check_team_size_limit();

-- ---------------------------------------------------------------------------
-- 7. Problem Statements modifications
-- ---------------------------------------------------------------------------
ALTER TABLE public.problem_statements ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE public.problem_statements ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT FALSE;
UPDATE public.problem_statements SET is_visible = visible WHERE visible IS NOT NULL;
UPDATE public.problem_statements SET file_url = file_path WHERE file_url IS NULL AND file_path IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 8. Submissions modifications
-- ---------------------------------------------------------------------------
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS ppt_url TEXT;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 1;
UPDATE public.submissions SET ppt_url = file_path WHERE ppt_url IS NULL AND file_path IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 9. Announcements modifications
-- ---------------------------------------------------------------------------
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'normal';
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
UPDATE public.announcements SET content = body WHERE content IS NULL AND body IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 10. Status Updates
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.status_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'info',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 11. Audit Log modifications
-- ---------------------------------------------------------------------------
ALTER TABLE public.audit_log ADD COLUMN IF NOT EXISTS actor_email TEXT;

-- ---------------------------------------------------------------------------
-- 12. Helper Functions
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_master()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (role::text = 'master' OR role::text = 'manager')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (role::text = 'admin' OR role::text = 'master' OR role::text = 'manager')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Unique Trainer and Team ID generators
CREATE OR REPLACE FUNCTION public.generate_trainer_id()
RETURNS TEXT AS $$
DECLARE
  candidate TEXT;
  exists_already BOOLEAN;
BEGIN
  LOOP
    candidate := 'TRN-KL3-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 6));
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE trainer_id = candidate) INTO exists_already;
    EXIT WHEN NOT exists_already;
  END LOOP;
  RETURN candidate;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.generate_team_id()
RETURNS TEXT AS $$
DECLARE
  candidate TEXT;
  exists_already BOOLEAN;
BEGIN
  LOOP
    candidate := 'TEAM-KL3-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 4));
    SELECT EXISTS(SELECT 1 FROM public.teams WHERE team_id = candidate) INTO exists_already;
    EXIT WHEN NOT exists_already;
  END LOOP;
  RETURN candidate;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- 13. Auth User trigger with @slrtce.in domain enforcement
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  assigned_role TEXT := 'participant';
  t_id TEXT;
  full_name_val TEXT;
BEGIN
  user_email := LOWER(TRIM(NEW.email));

  -- Check if email is in master allowlist
  IF EXISTS (SELECT 1 FROM public.master_allowlist WHERE LOWER(email) = user_email) THEN
    assigned_role := 'master';
  ELSE
    -- Must end with @slrtce.in
    IF NOT user_email LIKE '%@slrtce.in' THEN
      RAISE EXCEPTION 'Only @slrtce.in trainers may enter!';
    END IF;
  END IF;

  t_id := public.generate_trainer_id();
  full_name_val := COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(user_email, '@', 1));

  INSERT INTO public.profiles (id, trainer_id, full_name, email, role)
  VALUES (NEW.id, t_id, full_name_val, user_email, assigned_role::public.user_role)
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    email = EXCLUDED.email;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- Ensure all existing profiles have trainer_id
UPDATE public.profiles
SET trainer_id = public.generate_trainer_id()
WHERE trainer_id IS NULL;

-- ---------------------------------------------------------------------------
-- 14. Row Level Security Policies
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problem_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_allowlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
DROP POLICY IF EXISTS "Public profiles are readable by authenticated users" ON public.profiles;
CREATE POLICY "Public profiles are readable by authenticated users"
ON public.profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
ON public.profiles FOR ALL TO authenticated
USING (public.is_admin());

-- SOCIAL LINKS POLICIES
DROP POLICY IF EXISTS "Anyone authenticated can view social links" ON public.social_links;
CREATE POLICY "Anyone authenticated can view social links"
ON public.social_links FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can manage their own social links" ON public.social_links;
CREATE POLICY "Users can manage their own social links"
ON public.social_links FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- TEAMS POLICIES
DROP POLICY IF EXISTS "Anyone authenticated can read teams" ON public.teams;
CREATE POLICY "Anyone authenticated can read teams"
ON public.teams FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can create teams" ON public.teams;
CREATE POLICY "Authenticated users can create teams"
ON public.teams FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Team creators or admins can update team" ON public.teams;
CREATE POLICY "Team creators or admins can update team"
ON public.teams FOR UPDATE TO authenticated
USING (created_by = auth.uid() OR leader_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Team creators or admins can delete team" ON public.teams;
CREATE POLICY "Team creators or admins can delete team"
ON public.teams FOR DELETE TO authenticated
USING (created_by = auth.uid() OR leader_id = auth.uid() OR public.is_admin());

-- TEAM MEMBERS POLICIES
DROP POLICY IF EXISTS "Anyone authenticated can read team members" ON public.team_members;
CREATE POLICY "Anyone authenticated can read team members"
ON public.team_members FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can join team" ON public.team_members;
CREATE POLICY "Users can join team"
ON public.team_members FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Users can leave team or admin remove" ON public.team_members;
CREATE POLICY "Users can leave team or admin remove"
ON public.team_members FOR DELETE TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

-- PROBLEM STATEMENTS POLICIES
DROP POLICY IF EXISTS "Visible problem statements readable by all" ON public.problem_statements;
CREATE POLICY "Visible problem statements readable by all"
ON public.problem_statements FOR SELECT
USING (is_visible = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins manage problem statements" ON public.problem_statements;
CREATE POLICY "Admins manage problem statements"
ON public.problem_statements FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- SUBMISSIONS POLICIES
DROP POLICY IF EXISTS "Teams can view their own submissions" ON public.submissions;
CREATE POLICY "Teams can view their own submissions"
ON public.submissions FOR SELECT TO authenticated
USING (
  team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
  OR public.is_admin()
);

DROP POLICY IF EXISTS "Team members can insert submissions" ON public.submissions;
CREATE POLICY "Team members can insert submissions"
ON public.submissions FOR INSERT TO authenticated
WITH CHECK (
  team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
  OR public.is_admin()
);

-- ANNOUNCEMENTS POLICIES
DROP POLICY IF EXISTS "Announcements readable by everyone" ON public.announcements;
CREATE POLICY "Announcements readable by everyone"
ON public.announcements FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage announcements" ON public.announcements;
CREATE POLICY "Admins can manage announcements"
ON public.announcements FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- STATUS UPDATES POLICIES
DROP POLICY IF EXISTS "Status updates viewable by team members or user" ON public.status_updates;
CREATE POLICY "Status updates viewable by team members or user"
ON public.status_updates FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
  OR public.is_admin()
);

DROP POLICY IF EXISTS "Admins can manage status updates" ON public.status_updates;
CREATE POLICY "Admins can manage status updates"
ON public.status_updates FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- EVENT SETTINGS POLICIES
DROP POLICY IF EXISTS "Event settings readable by all" ON public.event_settings;
CREATE POLICY "Event settings readable by all"
ON public.event_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can update event settings" ON public.event_settings;
CREATE POLICY "Admins can update event settings"
ON public.event_settings FOR UPDATE TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- MASTER ALLOWLIST POLICIES
DROP POLICY IF EXISTS "Master allowlist readable by master" ON public.master_allowlist;
CREATE POLICY "Master allowlist readable by master"
ON public.master_allowlist FOR SELECT TO authenticated
USING (public.is_master());

DROP POLICY IF EXISTS "Master can modify allowlist" ON public.master_allowlist;
CREATE POLICY "Master can modify allowlist"
ON public.master_allowlist FOR ALL TO authenticated
USING (public.is_master())
WITH CHECK (public.is_master());

-- AUDIT LOG POLICIES
DROP POLICY IF EXISTS "Audit log readable by admin" ON public.audit_log;
CREATE POLICY "Audit log readable by admin"
ON public.audit_log FOR SELECT TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Authenticated can insert audit log" ON public.audit_log;
CREATE POLICY "Authenticated can insert audit log"
ON public.audit_log FOR INSERT TO authenticated
WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- 15. Realtime Setup
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.status_updates';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.submissions';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.teams';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
