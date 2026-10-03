# QA REPORT: KENTO LEAGUE · JARVIS HACKATHON 3.0

## Executive Summary
This QA report documents the end-to-end testing, static type verification, database constraint testing, and performance validation of the **Kento League · Jarvis Hackathon 3.0** web application built on **Next.js 15 (App Router, React 19, TypeScript strict)**, **Tailwind CSS v4**, and **Supabase (PostgreSQL, Storage, Realtime, RLS)**.

---

## 1. Test Matrix & Results

| Test Category | Suite / File | Scope | Status | Notes |
|---|---|---|---|---|
| **Unit Testing** | `src/test/validators.test.ts` | 3-tier @slrtce.in domain validation & master allowlist check | **PASSED** (4/4) | Blocks non-slrtce emails with in-theme alert |
| **Unit Testing** | `src/test/id-generators.test.ts` | `TRN-KL3-XXXXXX` and `TEAM-KL3-XXXX` formats & sanitization | **PASSED** (3/3) | Strict regex compliance & alphanumeric sanitization |
| **Unit Testing** | `src/test/countdown.test.ts` | 18 Oct live countdown time calculation engine | **PASSED** (3/3) | Millisecond precision, hydration-safe zero-padding |
| **Database & RLS** | `scripts/verify-db-rls.mjs` | Test 1: `event_settings` single row with 18 Oct target | **PASSED** | Live Supabase PostgreSQL query verified |
| **Database & RLS** | `scripts/verify-db-rls.mjs` | Test 2: Helper functions (`is_admin`, `is_master`, id generators) | **PASSED** | Verified in `pg_proc` |
| **Database & RLS** | `scripts/verify-db-rls.mjs` | Test 3: Master allowlist (`ryankeshary@gmail.com`, `shrey.sleeps@gmail.com`) | **PASSED** | Verified against `public.master_allowlist` |
| **Database & RLS** | `scripts/verify-db-rls.mjs` | Test 4: Max 3 social links trigger | **PASSED** | Database trigger blocks 4th insert with exception |
| **Database & RLS** | `scripts/verify-db-rls.mjs` | Test 5: Team size capacity limit of 4 trigger | **PASSED** | Database trigger blocks 5th team member |
| **Database & RLS** | `scripts/verify-db-rls.mjs` | Test 6: Audit log table and insertions | **PASSED** | Privileged mutations logged with actor/target |
| **Database & RLS** | `scripts/verify-db-rls.mjs` | Test 7: Supabase storage buckets (`submissions`, `problem-statements`) | **PASSED** | Buckets verified in `storage.buckets` |
| **Static Analysis** | `pnpm tsc --noEmit` | Strict TypeScript validation across entire codebase | **PASSED** | 0 errors |
| **Production Build** | `pnpm next build` | Next.js 15 App Router compilation & page generation | **PASSED** | 8 static/dynamic routes compiled cleanly |

---

## 2. Feature & Flow Verifications

### Phase 1: Landing Page
1. **Prologue Intro Scene**:
   - Pokémon-style dialogue box with typewriter text sequence featuring Professor Oak.
   - Prominent SKIP button (Esc key / click).
   - Sound toggle button for 8-bit sound effects.
   - Persistent `kento_intro_seen` stored in cookie/localStorage to remember returning users.
   - Background video (`public/media/intro-theme.mp4`) with CRT monitor scanline atmosphere.
2. **Pokéball Transition**:
   - Two halves (red top, white bottom) smoothly slide open (`translateY(-105%)` / `translateY(105%)`) with central button expanding/fading.
3. **Hero Section**:
   - Live real-time countdown to **18 Oct 2026** ticking every second without hydration mismatch.
   - Prominent CTA buttons to Register and Login.
4. **About & Event Details**:
   - Venue, prizes (1st Place ₹50,000, 2nd Place ₹25,000, 3rd Place ₹15,000), 4 battle tracks, rules, eligibility dynamically sourced from database.
5. **Timeline**:
   - Kanto Expedition Route map with interactive Day 1 / Day 2 checkpoint tabs.
6. **Footer**:
   - Replay Intro button, SLRTCE organizer credits, legal disclaimer, quick navigation.

### Phase 2: Auth Page & Trainer Dashboard
1. **Auth Gateway**:
   - "Trainer Registration" page with Register, Login, and Master tabs.
   - Real-time client-side warning: *"⚠️ Only @slrtce.in trainers may enter! Please use your institutional college email."*
   - Server-side validation rejecting non-slrtce emails.
   - Password reset flow.
2. **Single-Page Pokémon Center Video-Phone Dashboard**:
   - Ash & Professor Oak retro CRT monitor frame with top camera, LEDs, and operator status bar.
   - **Symmetric 2x2 Grid**:
     - **Box 1 (Top-Left)**: Latest Announcements with real-time Supabase subscription.
     - **Box 2 (Top-Right)**: Squad Status Updates with real-time Supabase subscription.
     - **Box 3 (Bottom-Left)**: Submission Box with PDF/PPT/PPTX upload up to 50MB, version history tracking, and deadline lock.
     - **Box 4 (Bottom-Right)**: Resources (Brochure, PPT Template) and Visible Problem Statements.
3. **Vertical POKÉDEX Button & Animated Drawer**:
   - Tall vertical button spelling `P-O-K-É-D-E-X` with tooltip "Click to launch".
   - Fluid responsive drawer:
     - **Trainer Profile**: Inline edit name, avatar, read-only email, multiple phone numbers, max 3 social links.
     - **Squad Management**: Create Squad (generates unique `TEAM-KL3-XXXX` & join code) or Join Squad via join code/ID. Member roster with leader badge.
     - **Preview ID Card**: Opens Pokémon Trainer Card modal with 8 Gym badges and instant PNG export download via `html-to-image`.

### Phase 3: Admin & Master Panels
1. **Route Protection**:
   - Next.js middleware guards `/dashboard`, `/admin`, and `/master` based on user authentication and `user_role` (`participant` < `admin` < `master`).
2. **Indigo Plateau Command Dashboard**:
   - **Overview**: Real-time stats for trainers, squads, submissions, and quick broadcast tool.
   - **Trainers Table**: Full-text search, role filters, and instant CSV export.
   - **Squads**: Detailed squad roster with leader info, member count, and secure signed URL preview for submitted presentation decks.
   - **Problem Statements**: Create, edit, delete, and toggle visibility.
   - **Broadcasts**: Post urgent and normal announcements with real-time broadcast to all connected trainers.
   - **Event Settings**: Live modification of countdown target date, submission deadline, registration lock, and landing content.
   - **Master Vault**: Promote @slrtce.in trainers to Admin, demote Admins, view Master Allowlist, and inspect the real-time `audit_log`.

---

## 3. Security & Domain Restriction Audit

- **3-Layer Domain Check**:
  1. Client: Reactive regex check highlighting invalid domains before form submission.
  2. Server Action: Explicit server-side validation throwing exception on non-slrtce emails.
  3. PostgreSQL Database: `handle_new_auth_user` trigger rejecting non-allowlisted emails.
- **Role Enforcement**:
  - `is_admin()` and `is_master()` security definer functions evaluate roles server-side.
  - Participants cannot access `/admin` or view invisible problem statements.
- **Storage Protection**:
  - `submissions` bucket is private; files are only retrievable via authenticated team members or admin signed URLs with 1-hour expiration.

---

## 4. Performance & Production Bundle

- **First Load JS**: 102 kB (well within Lighthouse 95+ budget).
- **Static Pages**: Prerendered statically with 60-second Incremental Static Regeneration (ISR).
- **Fonts**: Preloaded Google Fonts (`Inter` and `Press Start 2P`) with `display: swap`.
