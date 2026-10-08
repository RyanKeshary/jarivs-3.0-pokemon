# INDIGO TECH FEST · JARVIS 3.0
> **An Editorial Vintage Natural-History Tech Fest Platform for College Engineering**
> **Dates:** Day 1 (16 October 2026) · Day 2 (17 October 2026)
> **Venue:** [VENUE] · SLRTCE Campus, Mumbai
> **Organised by:** [CLUB/COLLEGE] · Technical Student Council

Built with **Next.js 15 (App Router, React 19, TypeScript strict)**, **Tailwind CSS**, **Framer Motion**, and **Supabase (PostgreSQL, Row-Level Security, Server Actions)**.

---

## 🏛️ Design System: Editorial Vintage Natural-History Print

Strict fidelity to the botanical & natural-history print plate aesthetic:
- **Palette:**
  - **Midnight Navy:** `#1B1E4A` (primary backdrop)
  - **Darker Navy:** `#121435` (alternating sections, cards, and `#0E1026` hard shadows)
  - **Warm Stone Grey:** `#AFAEA2` (illustrations, body copy, hairline dividers)
  - **Crimson Red:** `#D21319` (headlines, satin ribbons, buttons, active states)
  - **Light Paper Tone:** `#E9E6DA` (high-contrast text, panels, callouts)
- **Typography:**
  - Headlines: Tall, high-contrast Didone-style serif (`Bodoni Moda` via Google Fonts) in crimson or paper tone.
  - UI / Body: Clean, slightly chunky grotesk (`Space Grotesk`).
  - Metadata: Tiny, widely letter-spaced uppercase labels in stone grey.
- **Surface & Shape:**
  - Sharp, squared UI: 0 to 2px corner radius everywhere.
  - 1px stone-grey hairline borders (`#AFAEA2`).
  - Hard 3px offset shadows (`3px 3px 0px #0E1026`), zero blurry shadows.
  - Tactile 2px button press.
  - Subtle paper grain noise overlay.
  - **Strictly avoided:** Gradients, icon libraries (no Lucide), emojis, rainbow/violet colors, pill shapes, glass blurs, and em dashes.

---

## 📜 Website Sections & Storytelling

1. **Prologue / Intro Scene:**
   - Vintage editorial folio presentation with Ho-Oh Phoenix emblem, "ENTER THE FEST" and "SKIP" buttons. (Video removed as requested).
   - Once completed or skipped, a fullscreen crimson satin ribbon wipes diagonally across the screen to reveal the homepage.
   - Shown once per browser session via `sessionStorage`.
2. **Hero Title Card Plate:**
   - Editorial natural-history plate with Ho-Oh Phoenix crown emblem still and majestic.
   - Six engraved Pokemon with gentle looping idle animations:
     - **Snorlax:** deep breathing animation
     - **Jigglypuff:** gentle swaying
     - **Gengar:** peek-and-glint animation
     - **Pikachu:** paw and ear wave
     - **Psyduck:** head scratching animation
     - **Eevee:** bushy tail flicking
   - Thin crimson satin ribbons looping around the composition.
   - Temporal registration countdown to **16 Oct 2026** in serif numerals.
   - Two tactile buttons: `REGISTER FOR EVENTS` and `VIEW EVENT LEDGER`.
3. **The Fest (Manifesto):**
   - Three-sentence manifesto in large serif Didone type.
   - Progressive scroll-driven illumination where words transition from stone grey to paper white as you scroll.
4. **Day 1 / Day 2 Timeline:**
   - Chronological program flipping between Day 1 (16 Oct) and Day 2 (17 Oct) with a tracing crimson ribbon bar.
5. **Events Program Ledger:**
   - Full-width editorial index ledger (NOT a card grid).
   - Six competition disciplines:
     - `01. Project Exhibition` (Day 1 · Eevee)
     - `02. PID-geotto: Line Follower Robot Competition` (Day 1 · Pikachu)
     - `03. Cad-Mander: AutoCAD Design Competition` (Day 1 and Day 2 · Gengar)
     - `04. Quiz-tle: Technical Quiz` (Day 1 and Day 2 · Psyduck)
     - `05. Build-asor: Buildathon` (Day 1 and Day 2 · Snorlax)
     - `06. reelax: Reel Making` (Day 1 · Jigglypuff)
   - Hover animations on engraved Pokémon icons.
   - Inline expansion on click displaying rules of engagement, multi-round schedules, prizes, and preselected registration button.
6. **How to Join:**
   - Vertical numbered sequence: 1. Create a team, 2. Distribute unique code, 3. Teammates join.
7. **FAQ & Valedictory CTA:**
   - Accordion using typographic marks `[ + ]` and `[ — ]`.
   - Closing `REGISTER NOW` section crowned by the Phoenix wings motif.

---

## ⚡ Registration System

- **Two Registration Flows:**
  - **Create a Squad:** Leader enters details, selects event disciplines, names squad. System generates a unique, human-friendly code format: `JRV-XXXX` (excluding confusing characters `0, O, 1, I, L`, e.g. `JRV-7K4M`). Provides one-click Copy, WhatsApp share, and direct `/join/JRV-XXXX` link.
  - **Join a Squad:** Teammates open `/join/[code]`, inspect available slots, enter their details, and enroll directly without needing an account.
- **Leader Management via Magic Link:**
  - Secret token URL: `/team/manage/[token]`
  - Passwordless leader console to view members, remove a member, regenerate team code, rename squad, lock/unlock roster, or disband team before deadline.
- **Rules & Guardrails:**
  - **Schedule Clash Warning:** Real-time detection if selected events occur simultaneously on Day 1.
  - **Duplicate Prevention:** Matches email/phone so a participant cannot be on two different teams for the same discipline.
  - **Auto-Lock:** Team auto-locks when reaching max capacity.
  - **Anti-Spam:** Honeypot field and input validation.
  - **Draft Autosave:** Form drafts saved locally in `localStorage` across page reloads.

---

## 🛡️ Admin Panel (`/admin`)

- **Authentication:** Protected server-side route.
- **Seeded Admin Account:**
  - **Email:** `shrey.sleeps@gmail.com`
  - **Initial Password:** `password@67` (Changeable after first login via Security tab)
- **Features:**
  - **Dashboard:** Metrics, per-event capacity progress bars, registrations over time line chart in theme colors, incomplete squads, and waitlist counters.
  - **Registrations Table:** Filter by discipline, day, status (`Confirmed`, `Checked In`, `Qualified for Day 2`, `Pending`, `Disqualified`), search, sort, pagination, and bulk status updates.
  - **Teams Console:** View squads, member rosters, lock/unlock, regenerate code, change leader, move members, or delete squads.
  - **Onsite Check-In Scanner:** Mobile & phone-optimized rapid search (by name, code, or phone) with large one-tap check-in buttons for the event day.
  - **Event Settings Editor:** Configure capacity, slot times, team sizes, deadlines, and open/close toggles for each of the 6 disciplines.
  - **Notices / Announcements:** Broadcast alerts to site banner.
  - **CSV Export & Printable Sheet:** Export all or filtered registrants to CSV, and print event check-in sheets.
  - **Audit Log:** Complete chronicle of administrative actions.

---

## 🚀 Running Locally

```bash
# Install dependencies
pnpm install

# Run database migrations
node scripts/apply-migrations.mjs

# Verify admin password
node scripts/set-admin-passwords.mjs

# Start development server
pnpm dev
```

Server will run on `http://localhost:3000`.
Admin portal is accessible at `http://localhost:3000/admin`.
