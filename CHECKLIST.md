# CHECKLIST: KENTO LEAGUE · JARVIS HACKATHON 3.0

## Global Rules & Constraints
- [x] Light Theme only (Pokédex red `#EE1515`, Pokémon yellow `#FFCB05`, Pokémon blue `#3B4CCA`, soft greys, white)
- [x] Retro pixel font for headings (`Press Start 2P`) & clean sans for body (`Inter` / `Space Grotesk`)
- [x] Real Supabase database, real auth, real storage, real realtime (no mocked DB data)
- [x] Next.js 15 App Router + React 19 + TypeScript strict + Tailwind CSS + Framer Motion
- [x] Mobile-first and fully responsive design
- [x] Trainer ID format `TRN-KL3-XXXXXX`, Team ID format `TEAM-KL3-XXXX`
- [x] Strict @slrtce.in domain enforcement for participants & admins (client, server action, DB trigger)
- [x] Master login allowlist (`ryankeshary@gmail.com`, `shrey.sleeps@gmail.com`)

---

## Phase 1: Landing Page
- [x] Database migrations & schema setup (`event_settings`, `profiles`, `teams`, `submissions`, etc.)
- [x] Asset pipeline (`raw-assets/` processed to WebP, AVIF, PNG, seam ball, video in `public/media/intro-theme.mp4`)
- [x] Full-screen Pokémon dialogue intro sequence with typewriter text, sound toggle, SKIP button, and remember-seen
- [x] Pokéball transition animation (top half slides up, bottom half slides down)
- [x] Sticky retro Pokémon navbar with logo, audio toggle, and Login / Register / Dashboard links
- [x] Hero section with event title, tagline, real-time live countdown to 18 Oct (no hydration mismatch), CTA
- [x] About / Event Details section (venue, prizes, tracks, rules, eligibility dynamically loaded from DB)
- [x] Event Timeline section (interactive route-map style Pokémon region path loaded from DB)
- [x] Final CTA to register
- [x] Footer with organizer credits, links, and retro styling

---

## Phase 2: Auth Page + Trainer Dashboard
- [x] Auth page ("Trainer Registration") with Login / Register tabs, password reset
- [x] 3-tier domain validation (@slrtce.in warning: *"Only @slrtce.in trainers may enter!"*)
- [x] Master Login tab for allowlisted masters (`ryankeshary@gmail.com`, `shrey.sleeps@gmail.com`)
- [x] Single-page Pokémon Center Video-Phone Dashboard (Ash & Prof Oak retro device frame with CRT monitor screen)
- [x] Left 2x2 grid layout:
  - [x] Box 1 (top-left): Latest Announcements (Supabase Realtime)
  - [x] Box 2 (top-right): Team Status Updates (Supabase Realtime)
  - [x] Box 3 (bottom-left): Submission Box (upload PPT/PPTX/PDF, version history, deadline lock)
  - [x] Box 4 (bottom-right): Resources & Visible Problem Statements
- [x] Right vertical "POKÉDEX" launch button with hover tooltip
- [x] Animated Pokédex overlay with smooth layout reflow:
  - [x] Page 1: Trainer Profile (view + inline edit name, phones, socials max 3, Trainer ID, avatar)
  - [x] Page 2: Team Management (Create Team with join code / Join Team with Team ID, member list, disband/leave)
  - [x] "Preview ID Card" modal with Pokémon Trainer Card & PNG export download

---

## Phase 3: Admin & Master Panels
- [x] Admin authentication & role authorization middleware (`is_admin`, `is_master`)
- [x] Admin Overview (stats for participants, teams, submissions, real-time metrics)
- [x] Participants Management (search, filter, sort, pagination, CSV export)
- [x] Teams Management (team details, members, contact info, submission status & preview)
- [x] Problem Statements Management (upload, edit, delete, toggle visibility)
- [x] Announcements & Status Updates publisher
- [x] Event Settings & Landing Content live editor
- [x] Master Panel (add/remove admins, master allowlist management, audit log inspection)

---

## Phase 4: Analysis, Testing, QA & Deployment
- [x] Unit & component tests with Vitest (ID generator, countdown logic, domain validator)
- [x] Database verification test scripts (RLS, constraints, triggers)
- [x] Lighthouse performance optimizations (fonts preloading, image optimization, dynamic imports)
- [x] `QA_REPORT.md` test matrix and verification results
- [x] Production build validation (`next build`)
- [x] Git commits & push to `https://github.com/RyanKeshary/jarivs-3.0-pokemon.git`
