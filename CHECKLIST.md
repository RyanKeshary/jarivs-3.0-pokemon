# Kento League · Jarvis Hackathon 3.0 — Master Checklist

## Phase 1: Landing Page & Visual Identity
- [x] Pokémon visual aesthetic (Pokédex red `#EE1515`, Pokémon yellow `#FFCB05`, blue `#3B4CCA`, white & soft grey accents).
- [x] Retro pixel font for headings (`Press Start 2P`) & clean readable body font (`Space Grotesk` / `Inter`).
- [x] Raw assets extracted & optimized (WebP, AVIF, PNG) via `scripts/prep-assets.py`.
- [x] Full-screen intro video with dialogue typewriter effect, sound toggle (muted by default), SKIP button, session remembrance.
- [x] Two-half Pokéball sliding transition revealing the landing page.
- [x] Hero section: "Kento League · Jarvis Hackathon 3.0", tagline, live ticking countdown to 18 Oct from DB without hydration mismatch, registration deadline, CTA.
- [x] About & Event Details section (venue, prizes, tracks, rules, eligibility from DB).
- [x] Event Timeline section (Pokémon region route-map path style, animated nodes).
- [x] Final CTA to register.
- [x] Footer with organizer credits, links, socials.
- [x] Sticky navbar with direct Login / Register navigation.

## Phase 2: Auth Page + Trainer Dashboard (Pokémon Center Video-Phone)
- [x] Trainer Registration & Login page with tabs, password reset.
- [x] Three-layer `@slrtce.in` email restriction with in-theme warning banner ("Only @slrtce.in trainers may enter!").
- [x] Master Login entry allowing allowlisted organizers (`ryankeshary@gmail.com`, `shrey.sleeps@gmail.com`).
- [x] Pokémon Center video-phone dashboard (`/center`):
  - [x] Retro device frame with screen (`monitor.png`).
  - [x] Symmetric 2x2 grid of 4 boxes:
    - [x] Box 1 (top-left): Latest Announcements (realtime Supabase subscription).
    - [x] Box 2 (top-right): Team Status Updates (realtime Supabase subscription).
    - [x] Box 3 (bottom-left): Submission box (PPT/PPTX/PDF private storage upload, version history, deadline lock, file replacement).
    - [x] Box 4 (bottom-right): Resources (Brochure, PPT Template, Problem Statements where `is_visible=true`).
  - [x] Tall vertical middle button spelling "POKÉDEX" with hover tooltip "Click to launch".
  - [x] Animated Pokédex overlay:
    - [x] Smooth grid resize/re-flow without layout break.
    - [x] Page 1: Trainer Profile (name, avatar, read-only email, multiple phone numbers, up to 3 socials, unique Trainer ID `KNT-YYYY-NNNN`).
    - [x] Page 2: Team (Create team, Join via code, member list with Trainer IDs, leave/disband, team size cap).
    - [x] "Preview ID Card" modal with Pokémon trainer card style (Trainer ID, name, avatar, team) & PNG download.
  - [x] Optional sound effects (OFF by default).

## Phase 3: Admin & Master Panels
- [x] Admin Overview dashboard with live stats (participants, teams, submissions) & charts.
- [x] Participants table with search, filter, sort, pagination, and CSV export.
- [x] Teams management with full details, member contacts, submission status & signed URL download.
- [x] Problem Statements management (upload, edit, delete, toggle visible/hidden).
- [x] Announcements & status updates posting.
- [x] Event Settings & countdown target management.
- [x] Master Panel (add/remove admins, allowlist management, audit log viewer).
- [x] Audit log recording all administrative mutations.

## Phase 4: Verification, Testing & QA
- [x] Vitest unit test suite (file validation, membership constraints, auth rules, countdown timer logic).
- [x] Database RLS automated test suite (`scripts/verify-rls.mjs` - 27 tests).
- [x] Database Phase 2 workflow test suite (`scripts/verify-phase2.mjs` - 65 tests).
- [x] Full build verification (`tsc -b && vite build`).
- [x] End-to-end integration & UI polish.
- [x] Comprehensive QA_REPORT.md documentation.
- [x] Commit & push to GitHub repository.
