# KENTO LEAGUE · JARVIS HACKATHON 3.0
> **Official Pokémon-Themed Hackathon Platform for Shree L. R. Tiwari College of Engineering (SLRTCE)**

Built with **Next.js 15 (App Router, React 19, TypeScript strict)**, **Tailwind CSS v4**, **Framer Motion**, and **Supabase (PostgreSQL, Storage, Realtime, RLS)**.

---

## ⚡ Key Highlights
- **Authentic Pokémon Aesthetics**: Pokédex red (`#EE1515`), Pokémon yellow (`#FFCB05`), Pokémon blue (`#3B4CCA`), retro pixel font (`Press Start 2P`), CRT monitor scanlines, and optional Web Audio 8-bit sound effects.
- **Prologue Intro Scene & Pokéball Transition**: Fullscreen dialogue box typewriter sequence with Professor Oak, prominent SKIP button, remember-seen cookie, and sliding Pokéball reveal.
- **Pokémon Center Video-Phone Dashboard**: Ash & Professor Oak CRT terminal frame with a symmetric 2x2 grid of 4 boxes (Announcements, Status Updates, Submissions, Resources) and a vertical middle `POKÉDEX` launcher button.
- **Fluid Pokédex Overlay & Trainer Card**: View/edit profile (name, multiple phones, max 3 socials), squad management (create/join team via unique `TEAM-KL3-XXXX` code), and downloadable Pokémon Trainer Card with PNG export.
- **3-Tier Domain Validation**: Strict `@slrtce.in` institutional email requirement enforced in the client, server actions, and PostgreSQL triggers with in-theme warnings.
- **Indigo Plateau Admin & Master Command**: Real-time overview metrics, participant table with CSV export, squad roster with signed PPT deck preview, problem statement manager, live broadcast engine, event settings editor, and Master Vault with audit logging.

---

## 🛠️ Tech Stack
- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, React 19, TypeScript Strict)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with custom retro pixel design system
- **Database & Backend**: [Supabase](https://supabase.com/) (PostgreSQL 15+, Storage, Realtime, Row-Level Security) with `@supabase/ssr`
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Forms & Validation**: [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)
- **State Management**: [TanStack Query v5](https://tanstack.com/query)
- **Audio**: Web Audio API 8-bit Synthesizer (Zero external audio files required, OFF by default)
- **Testing**: [Vitest](https://vitest.dev/) & automated database verification suites
- **Package Manager**: `pnpm`

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js `20.x` or higher
- `pnpm` (`npm install -g pnpm`)
- Python 3 with `Pillow` (for asset optimization script)

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/RyanKeshary/jarivs-3.0-pokemon.git
cd jarivs-3.0-pokemon

# Install dependencies
pnpm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://oqqzzyombtcjvlqbjvla.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_QMmz5ZNtmwnZssxC6KnH1g_zoRZ6FIr
SUPABASE_SERVICE_ROLE_KEY=sb_secret_ewtYkko7i-hunSbn7A2buw_1PBLpRn2
DATABASE_URL=postgresql://postgres.oqqzzyombtcjvlqbjvla:golumolu1234$@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Database Migrations & Asset Prep
```bash
# Apply migrations to Supabase PostgreSQL
pnpm db:migrate

# Prepare optimized placeholder assets from raw-assets/
pnpm assets:prep
```

### 5. Running Locally
```bash
# Start Next.js development server
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & Verification

```bash
# Run Vitest unit tests (validators, ID formatting, countdown math)
pnpm test

# Run database schema & RLS test suite
node scripts/verify-db-rls.mjs

# Strict TypeScript type check
pnpm tsc --noEmit

# Production bundle build test
pnpm build
```

---

## 🛡️ Master & Admin Accounts
- **Master Allowlist**: `ryankeshary@gmail.com` and `shrey.sleeps@gmail.com` can authenticate via the **Master Login** tab.
- **Admin Promotion**: Masters can promote any registered `@slrtce.in` trainer to Admin directly from the **Master Vault** in the `/admin` portal.

---

## 🚢 Deployment

### Vercel Deployment
Target: Vercel (Project ID: `prj_DLG9sygKVlIDY5R9pZCTQQgtj6TO`)
1. Connect GitHub repository `RyanKeshary/jarivs-3.0-pokemon`.
2. Configure environment variables matching `.env.example`.
3. Build command: `pnpm build` (Package manager: `pnpm`).

### Render Deployment
Target: Render (Service ID: `srv-davvt9nlk1mc73co7670`, [https://jarivs-3-0-pokemon.onrender.com](https://jarivs-3-0-pokemon.onrender.com))
- Build Command: `pnpm install && pnpm build`
- Start Command: `pnpm start`

---

## 📜 License & Disclaimers
© 2026 Kento League · Jarvis Hackathon 3.0 at Shree L. R. Tiwari College of Engineering.
*Disclaimer: Pokémon and Pokémon character names are trademarks of Nintendo, Creatures Inc., and GAME FREAK inc. This web application is created for an educational collegiate hackathon event.*
