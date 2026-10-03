# Kento League · Jarvis Hackathon 3.0 — QA Report & Verification Matrix

## Executive Summary
This document provides the full verification, test matrix, and defect remediation report for the Kanto League – Jarvis Hackathon 3.0 Pokémon-themed hackathon platform.

- **Automated Unit Tests**: 45 passed (4 test suites)
- **Database RLS Verification Suite**: 27 passed, 0 failed (`scripts/verify-rls.mjs`)
- **Phase 2 & 3 Workflow Verification Suite**: 65 passed, 0 failed (`scripts/verify-phase2.mjs`)
- **Type Checking**: Clean (`tsc -b` 0 errors)
- **Production Build**: Clean in 2.61s with route-level code splitting

---

## 1. Automated Test Matrix

### Unit Test Suite (Vitest)
| Test Suite | Tests | Status | Description |
|---|---|---|---|
| `src/test/file.test.ts` | 4 | PASS | Validates deck extensions (.ppt, .pptx, .pdf), size limits (50MB), filename sanitization |
| `src/test/membership.test.ts` | 7 | PASS | Validates team capacity limits, leader assignment, single-team constraint rules |
| `src/test/auth.test.ts` | 11 | PASS | Validates `@slrtce.in` domain enforcement, organizer allowlist exceptions, role boundaries |
| `src/test/time.test.ts` | 23 | PASS | Validates countdown calculation, IST timezone formatting, deadline locking, hydrations |

### Database & RLS Security Suite (`scripts/verify-rls.mjs`)
| Check # | Test Name | Result | Verification Detail |
|---|---|---|---|
| 1 | Allowlisted Gmail address accepted | PASS | status 200 |
| 2 | Un-allowlisted Gmail rejected | PASS | status 500 (rejected by trigger) |
| 3 | `@slrtce.in` address accepted | PASS | status 200 |
| 4 | Profile auto-created with role `trainer` | PASS | `role: trainer` |
| 5-7 | Anon can read `event_config`, `timeline_events`, `content_blocks` | PASS | status 200 |
| 8-12 | Anon denied reading `profiles`, `teams`, `registrations`, `submissions`, `allowed_emails` | PASS | 0 rows or 401 |
| 13 | Trainer can read their own profile | PASS | status 200 |
| 14 | Trainer cannot read another trainer's profile | PASS | 0 rows |
| 15 | Trainer cannot self-promote to admin | PASS | status 403, role unchanged |
| 16 | Trainer cannot alter event countdown config | PASS | status 200, registration_open=true |
| 17 | Trainer sees no other team members | PASS | 0 rows |
| 18-20 | Realtime publication configuration | PASS | `event_config`, `timeline_events`, `content_blocks` |
| 21-22 | Storage bucket policies | PASS | `submissions` is PRIVATE, `site-assets` is public |
| 23-27 | Seed data verification | PASS | Target 18 Oct 2026 12:00 IST, 6 stops, 7 content blocks, allowlist |

### Phase 2 & 3 Workflow Suite (`scripts/verify-phase2.mjs`)
- **65 comprehensive checks** covering:
  - Automatic `trainer_id` generation (`KNT-YYYY-NNNN`)
  - Unique team generation (`TEAM-XXXX`) and 6-char `join_code`
  - Team creation, joining via join_code, team size limit triggers
  - Leadership automatic handover on leader departure
  - Storage file path isolation (`<team_id>/<file>`)
  - Submissions version incrementing (`v1` -> `v2` on replace)
  - Cross-team submission data isolation (RLS prevents reading other teams' decks)
  - Problem statements visibility toggle (trainers only see `visible = true`, admins see all)
  - Announcements write privileges (trainers blocked 403, managers allowed 201)

---

## 2. Defects Found & Resolved

### Defect 1: Legacy `trg_guard_team_captain` Breaking Team Updates
- **Root Cause**: In migration `0009_phase2_schema.sql`, `teams.captain_id` was renamed to `leader_id`, but the legacy trigger `trg_guard_team_captain` still referenced `new.captain_id`, crashing any update to `public.teams` with `record "new" has no field "captain_id"`.
- **Resolution**: Created and applied migration `0019_drop_obsolete_guard_team_captain.sql` to cleanly drop the obsolete trigger and function.

### Defect 2: Submissions Table Constraints Incompatible with Phase 2
- **Root Cause**: `public.submissions` enforced `deck_mime_type` and `deck_size_bytes` as NOT NULL and enforced a regex stripping hyphens `replace(team_id::text, '-', '')` without subdirectories. In Phase 2, uploads store standard UUIDs with hyphens and version folders (e.g. `<team_id>/v1/<file>`).
- **Resolution**: Created and applied migration `0020_fix_submissions_schema.sql` to relax NOT NULL on mime/size and support standard storage paths with hyphens and version folders.

### Defect 3: Pokémon Center Dashboard Placeholder Implementation
- **Root Cause**: `src/routes/center.tsx` previously contained static placeholders with `<EditMe>` tags instead of live Supabase queries and components.
- **Resolution**: Implemented the complete Pokémon Center Video-Phone Terminal:
  - Symmetric 2x2 grid of 4 equal-sized boxes: Announcements (realtime), Team & Status (realtime), Deck Submissions (storage upload, version history, signed URL, deadline lock), Resources (brochure, template, problem statements modal).
  - Vertical stacked POKÉDEX button with hover tooltip and responsive shrink animation.
  - Pokédex drawer with Trainer Profile (inline editing, mobile numbers, max 3 socials) and Team Squad management (create, join, leave).
  - Trainer Card ID preview modal with HTML5 Canvas PNG export.
  - Retro 8-bit sound effects (Web Audio API, OFF by default).

---

## 3. Performance & Optimization Highlights
- **Fonts**: Self-hosted latin subsets (`Press Start 2P`, `Space Grotesk`) preloaded in `index.html` with `crossorigin`.
- **Code Splitting**: Route-level lazy loading separates Landing (20KB), Auth (8.9KB), Center (44KB), Admin (79KB), and IntroScene (3.6KB).
- **Responsive Animations**: Framer Motion layout animations for the Pokédex expansion prevent layout reflows and CLS.
