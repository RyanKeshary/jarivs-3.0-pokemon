# INDIGO TECH FEST · JARVIS 3.0 (KENTO LEAGUE)
> **The Official Digital Operating System & Event Automation Platform for Indigo Tech Fest**  
> *Annual Flagship Engineering Symposium · SLRTCE Campus, Mumbai*  
> **Technologies:** Next.js 15 (App Router, React 19, TypeScript) · Supabase (PostgreSQL & RLS) · Tailwind CSS · Framer Motion · Resend

---

## 🌟 Executive Summary & Mission

**Jarvis 3.0** is the comprehensive, end-to-end digital event operating system engineered specifically for **Indigo Tech Fest (Kento League)**. Designed to seamlessly manage hundreds of engineering participants across 6 high-stakes technical disciplines, Jarvis 3.0 was built with a singular operational mandate:

> **Complete Paperwork Eradication:** Replace physical registration desks, printed spreadsheets, clipboard sign-in rosters, physical receipts, paper rulebooks, and token slips with a **100% cloud-automated, zero-paperwork platform**.

By consolidating attendee onboarding, team formation, clash detection, onsite attendance, project submissions, and admin telemetry into one unified real-time application, the platform reduced administrative overhead to zero while delivering an editorial vintage natural-history and Pokémon-themed digital experience.

---

## 🚫 Paperwork to Absolute Zero: The Digital Shift

Before Jarvis 3.0, technical fest operations required extensive manual effort, physical files, manual attendance clipboards, and post-fest data reconciliations. Jarvis 3.0 replaced every single paper touchpoint with automated cloud logic:

| Operational Process | Traditional College Fest (Manual Paperwork) | Jarvis 3.0 Automated Cloud Solution |
| :--- | :--- | :--- |
| **Registration Intake** | Long physical queues, paper registration slips, carbon-copy receipts. | **Self-serve digital portal** with instant slot reservations and real-time validation. |
| **Team Formation** | Handwritten slips passed between students, lost team forms. | **Unique Human-Friendly Squad Codes (`JRV-XXXX`)** and 1-click WhatsApp squad invite links. |
| **Schedule Clashes** | Manual checking of student timetables leading to double-booking. | **Algorithmic real-time clash warning** preventing simultaneous Day 1 registrations. |
| **ID & Entry Passes** | Printed paper badges or wristbands subject to damage/loss. | **Interactive Digital Trainer Cards** featuring custom avatars, roll numbers, and verifiable QR codes. |
| **Day-Of Event Check-In**| Printed desk rosters, physical highlighters, slow queue bottlenecks. | **Mobile-optimized real-time Check-In Scanner** with 1-tap status updates for volunteers. |
| **Team Adjustments** | Desks besieged by students asking to swap members or change names. | **Passwordless Magic-Link Self-Service Console (`/team/manage/[token]`)** for team leaders. |
| **Project Submissions** | Collecting physical USB flash drives, paper reports, loose CDs. | **Digital Submission Box** accepting GitHub repositories, Google Drive demos, and pitch decks. |
| **Announcements** | Shouting through megaphones or taping paper notices to noticeboards. | **Live Real-Time Notification Banners** and automated transactional email dispatch. |
| **Faculty & Council Audits**| Days of compiling handwritten records into Excel files. | **1-Click Filtered CSV & Printable Ledger Exports** generated directly from live database tables. |

---

## ⚡ Core Architecture & User Workflows

```mermaid
graph TD
    A[Visitor Lands on Site] --> B{Action}
    B -->|Explore| C[Interactive Fest Ledger & Timeline]
    B -->|Register Squad| D[Squad Creation Flow]
    B -->|Join Existing| E[Direct Join /join/code]
    
    D --> D1[Enter Personal & College Info]
    D1 --> D2[Select Disciplines + Clash Check]
    D2 --> D3[Generate JRV-XXXX & Magic Link]
    
    E --> E1[Auto-Validate Remaining Slots]
    E1 --> E2[Instant Roster Enrollment]
    
    D3 --> F[Attendee Dashboard /dashboard]
    E2 --> F
    
    F --> F1[Digital Trainer Passcard]
    F --> F2[Project Submission Box]
    F --> F3[Live Broadcast Announcements]
    
    G[Onsite Entrance Desk] --> H[Admin / Coordinator Portal]
    H --> H1[1-Tap Mobile Check-In Scanner]
    H --> H2[Live Capacity & Waitlist Controls]
    H --> H3[Squad Reassignment & Code Reset]
    H --> H4[Broadcast Email Dispatch]
```

### 1. Participant & Squad Workflows

- **Squad Creation Flow (`/` modal & `/auth`):**
  - Team leaders enter personal metadata: Full Name, College, Roll Number, Student ID, Phone, and Email.
  - Leaders select competition tracks. The system performs instantaneous **clash detection** across concurrent Day 1 events.
  - On submission, an unguessable yet human-readable squad code is generated (e.g. `JRV-7K4M`, excluding ambiguous characters like `0, O, 1, I, L`).
  - Automatic generation of a **1-click WhatsApp Invitation Link** containing prefilled enrollment copy for teammates.
- **Direct Squad Join (`/join/[code]`):**
  - Prospective members open the squad link. The system fetches the squad's remaining vacancies in real-time.
  - Members enter their details and are instantly locked into the team roster.
  - When the event's team maximum is reached, the squad automatically transitions to **Locked** status, preventing unauthorized additions.
- **Passwordless Leader Console (`/team/manage/[token]`):**
  - Leaders receive an encrypted magic token link.
  - Without requiring account logins or passwords, leaders can:
    - View and audit all accepted teammates.
    - Remove inactive or erroneous members.
    - Regenerate the squad code if compromised.
    - Rename their squad or disband the team before the event deadline.
- **Attendee Video-Phone Dashboard (`/dashboard`):**
  - **Digital Trainer Passcard:** High-contrast retro pass showcasing student roll number, division, squad code, and verified registration badge.
  - **Submission Box:** Direct submission gateway for project code repositories, live demo URLs, and presentation slide decks.
  - **Live Announcements Ticker:** Direct broadcast feed displaying immediate room changes, round schedules, and stage calls.
  - **Resource Terminal:** One-click downloads for official event rulebooks and problem statements.

---

### 2. Administrative & Coordinator Operations (`/admin`)

The `/admin` portal serves as the unified command center for council chairs, event leads, and floor coordinators:

- **Telemetry Dashboard:**
  - Real-time KPIs: Total Participants, Squads, Checked-In Attendees, Incomplete Rosters, and Waitlist count.
  - Live capacity visualization bars for each of the 6 disciplines.
  - Registration progression graph mapped across timeline intervals.
- **Registrations Ledger:**
  - Real-time pagination, instant multi-attribute search (by name, roll number, email, phone, or squad code), and filters for discipline and status (`Confirmed`, `Checked In`, `Qualified for Day 2`, `Pending`, `Disqualified`).
  - Inline participant editing, manual walk-in entry creation, and bulk status updates.
- **Teams Console:**
  - Complete visibility over all registered squads and their internal rosters.
  - Administrative squad override capabilities: force-lock/unlock rosters, reassign team leadership, transfer members between squads, or delete duplicate teams.
- **Onsite Mobile Check-In Desk:**
  - Optimized for smartphone screens carried by floor volunteers at venue entrance doors.
  - Instant lookup and high-visibility **1-Tap Check-In** buttons with visual confirmations, permanently removing physical registration desks.
- **Discipline & Settings Controller:**
  - Dynamically open or close registrations per event.
  - Adjust maximum team capacities, team size thresholds, deadlines, and time slot configurations on the fly without code deployments.
- **Omnichannel Broadcast Engine:**
  - Targeted email announcements dispatched via Resend / Nodemailer.
  - Filter recipient targets by event discipline, qualification status, or team leader role with variable template interpolation.
- **Coordinator Delegation (RBAC):**
  - Create, manage, and reset credentials for student event coordinators.
  - Granular permissions restrict coordinators to their assigned disciplines while keeping system settings protected.
- **Audit Logging:**
  - Immutable historical audit trail documenting every status change, check-in, team edit, and administrative action.

---

## 🎮 The Competition Ledger (6 Disciplines)

Jarvis 3.0 orchestrates registrations and multi-round tracks across 6 distinct engineering competitions:

1. **Poké Expo · Project Exhibition (Day 1 · Eevee):**
   - Flagship hardware, software, and IoT project showcase judged by industry evaluators.
2. **PID-geotto · Line-Follower Race (Day 1 · Pikachu):**
   - High-speed autonomous robotics track competition utilizing PID controllers and optical sensors.
3. **Cad-Mander · AutoCAD Design Arena (Days 1 & 2 · Gengar):**
   - Precision 2D drafting and 3D computer-aided mechanical engineering design challenge.
4. **Quiz-tle · Technical Brainstorm (Days 1 & 2 · Psyduck):**
   - Multi-round engineering, algorithmic, and general tech buzzer quiz.
5. **Build-asor · Buildathon (Days 1 & 2 · Snorlax):**
   - Rapid software/hardware prototype hackathon spanning problem statement release to final demo.
6. **Snorreelax · Tech Reel & Media (Day 1 · Jigglypuff):**
   - Digital storytelling and short-form video creation capturing the spirit and innovation of the fest.

---

## 🎨 Design Philosophy: Editorial Vintage Natural-History

The user interface adheres to a curated, high-end editorial natural-history print plate aesthetic fused with classic Pokémon lore:

- **Color Palette:**
  - **Midnight Navy (`#1B1E4A`):** Deep, distraction-free foundation.
  - **Darker Navy (`#121435`):** Alternating panels and solid `#0E1026` offset drop shadows.
  - **Warm Stone Grey (`#AFAEA2`):** Botanical illustrations, hairline borders, and metadata typography.
  - **Crimson Red (`#D21319`):** Satin banners, highlights, active states, and call-to-actions.
  - **Light Paper Tone (`#E9E6DA`):** High-contrast readability for primary typefaces and callouts.
- **Typography:**
  - **Headlines:** Tall, high-contrast Didone serif (`Bodoni Moda`) evoking historical botanical folios.
  - **Interface & Body:** Crisp, legible grotesk (`Space Grotesk`) engineered for small-screen data legibility.
  - **Metadata:** Widely letter-spaced uppercase labels for timestamps and category tags.
- **Surface & Form:**
  - Crisp, squared geometry (0px to 2px corner radius) reflecting physical print plates.
  - 1px hairline dividers with 3px hard tactile offset shadows (`3px 3px 0px #0E1026`), deliberately rejecting generic blurred shadows and pastel gradients.
  - Micro-animations: Custom sprite-based idle animations for engraved Pokémon mascots.

---

## 🛠️ Technology Stack & System Architecture

```
┌───────────────────────────────────────────────────────────┐
│                    NEXT.JS 15 APP ROUTER                  │
│                                                           │
│  Landing & Ledger      Registration & Join     Dashboard  │
│  [EventsLedger.tsx]    [RegistrationModal]     [VideoPhone│
│  [HeroSection.tsx]     [/join/[code]]           Dashboard]│
│                                                           │
│                  Admin Command Center                     │
│               [IndigoAdminDashboard.tsx]                  │
└─────────────┬───────────────────────────────┬─────────────┘
              │                               │
              ▼                               ▼
    [Next.js Server Actions]        [Next.js API Routes]
    • Registration validation       • CSV Export engine
    • Clash detection               • Webhooks & cron handlers
    • Status updates & check-in     • Email delivery
              │                               │
              └───────────────┬───────────────┘
                              │
                              ▼
┌───────────────────────────────────────────────────────────┐
│                 SUPABASE / POSTGRESQL (RLS)               │
│                                                           │
│  • registrations         • teams              • events    │
│  • event_coordinators    • announcements      • audit_logs│
│                                                           │
│  Row-Level Security (RLS) · Foreign Keys · Cascade Deletes│
└─────────────────────────────┬─────────────────────────────┘
                              │
                              ▼
┌───────────────────────────────────────────────────────────┐
│                EXTERNAL INTEGRATIONS & BACKUPS            │
│  • Resend / Nodemailer (Transactional Dispatch)           │
│  • Google Drive & Local Disaster Recovery Backups         │
└───────────────────────────────────────────────────────────┘
```

- **Frontend Framework:** Next.js 15.1 (App Router, React 19, TypeScript strict mode).
- **Styling & Motion:** Tailwind CSS v4, Framer Motion for tactile page transitions, Lucide React icons.
- **Backend & Database:** Supabase PostgreSQL with custom migration scripts, Row-Level Security (RLS) enforcement, and server actions.
- **Mailing Engine:** Integrated Resend API and Nodemailer SMTP for automated transactional confirmations.
- **Form State & Resilience:** Local storage draft autosave to preserve participant progress across page reloads.
- **Disaster Recovery:** Multi-table snapshot engine creating point-in-time `.tar.gz` and standalone `.sql` recovery packages (`npm run db:backup` / `npm run db:restore`).

---

## 📁 Repository Directory Structure

```
├── .github/workflows/          # CI/CD and disaster-recovery backup workflows
├── public/                     # Static assets, Pokémon sprites, emblems, and audio
├── scripts/                    # Operational automation scripts
│   ├── apply-migrations.mjs    # Database migration runner
│   ├── backup-database.mjs     # Standalone disaster recovery snapshot generator
│   ├── restore-database.mjs    # Verified single-command restoration engine
│   └── set-admin-passwords.mjs # Credential seeding and verification utility
├── src/
│   ├── app/                    # Next.js App Router entry points
│   │   ├── actions/            # Type-safe Server Actions (admin, registration, backup)
│   │   ├── admin/              # Protected admin command center
│   │   ├── api/                # REST endpoints (exports, cron, webhooks)
│   │   ├── auth/               # Attendee sign-in and badge selection
│   │   ├── dashboard/          # Attendee video-phone terminal and submission box
│   │   ├── join/               # Dynamic squad join routes (/join/[code])
│   │   └── team/               # Passwordless squad management (/team/manage/[token])
│   ├── components/             # Modular React components
│   │   ├── admin/              # Admin dashboard, check-in scanner, guardian
│   │   ├── dashboard/          # Trainer card, submission box, resource center
│   │   ├── effects/            # Thematic audio and interactive animations
│   │   ├── layout/             # Navigation and footer
│   │   ├── registration/       # Multi-step squad registration modal
│   │   └── sections/           # Landing sections (Ledger, Timeline, FAQ)
│   └── lib/                    # Shared database clients and utilities
│       ├── email.ts            # Email broadcast and template engine
│       └── supabase/           # Client, server, and administrative Supabase instances
├── supabase/migrations/        # Sequential SQL migrations (schema, RLS, audit logs)
├── vercel.json                 # Vercel deployment and routing configuration
└── package.json                # Project dependencies and script declarations
```

---

## 🚀 Quickstart & Local Development

### Prerequisites
- Node.js 20+
- `pnpm` (v9 recommended)
- Supabase Project URL and Service Role Key (or local PostgreSQL instance)

### Setup Instructions

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/RyanKeshary/jarivs-3.0-pokemon.git
   cd jarivs-3.0-pokemon
   ```

2. **Install Dependencies:**
   ```bash
   pnpm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the project root:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   DATABASE_URL=postgresql://postgres:password@db-host:5432/postgres

   # Admin Credentials
   ADMIN_EMAIL=shrey.sleeps@gmail.com
   ADMIN_PASSWORD=your-secure-password

   # Email Service (Optional for local testing)
   RESEND_API_KEY=your-resend-api-key
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   ```

4. **Apply Database Migrations:**
   ```bash
   node scripts/apply-migrations.mjs
   ```

5. **Start the Development Server:**
   ```bash
   pnpm dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser. The Admin Console is accessible at [http://localhost:3000/admin](http://localhost:3000/admin).

---

## 🔒 Security & Data Integrity

- **Row-Level Security (RLS):** Every Supabase table is secured with restrictive Postgres RLS policies, ensuring public queries can only read event data while registration write operations are validated server-side.
- **Server Action Validation:** All mutations run via Next.js Server Actions with strict input sanitization, honeypot spam protection, and type validation.
- **Audit Logging:** Every administrative mutation, status override, and roster adjustment is committed to an immutable `audit_logs` table with admin metadata and timestamps.
- **Disaster Recovery:** Includes verified backup scripts generating full database dumps and checksummed manifests ready for point-in-time recovery.

---

## 🏆 Project Impact

By taking college tech fest operations entirely online, **Jarvis 3.0** achieved:
- **100% Paperless Execution:** Zero paper registration sheets, zero printed badges, zero physical submission thumb drives, and zero manual score sheets.
- **Instant Event Check-Ins:** Check-in turnaround times reduced from minutes per squad to under **3 seconds** using mobile check-in scanning.
- **Flawless Schedule Harmony:** Zero double-booked participants across parallel competition tracks.
- **Live Institutional Transparency:** Comprehensive, real-time event analytics accessible to organizers, faculty, and student council members anytime.

---

*Designed and engineered with pride for Indigo Tech Fest · Technical Student Council.*
