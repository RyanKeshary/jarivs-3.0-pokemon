# Kanto League Jarvis Hackathon 3.0 ⚡🔴⚪

A Pokémon Gen 1 styled web platform for the **Jarvis Hackathon 3.0**, built with modern web technologies, real-time database reactivity, and high-performance game-inspired aesthetics.

---

## 🎮 Key Features

- **Retro Game Aesthetic**: Authentic Pokémon Red/Blue retro-gaming UI with glassmorphism, CRT scanlines, custom retro fonts (Press Start 2P, Silkscreen), and Pokédex drawers.
- **Real-Time Data Engine**: Live updates across public landing, trainer dashboard (`/center`), and admin panel (`/admin`) powered by Supabase Realtime subscriptions.
- **IST Event Clock**: Resilient, drift-aligned countdown ticker strictly locked to Indian Standard Time (`Asia/Kolkata`, UTC+05:30).
- **Trainer Center (`/center`)**: Interactive 2x2 grid dashboard for registered participants, featuring live announcements, team rosters, and pitch deck submission management.
- **Admin Control Room (`/admin`)**:
  - Live participant, team, and deck submission metrics
  - Participant management, filtering, and role elevation
  - Problem statements reveal scheduler
  - Event resource hub (brochures, PPT templates)
  - Full event timeline and deadline configuration
  - Protected multi-level administrative access control (Managers & Admins)
- **Robust Security & RLS**: 100% Row-Level Security enabled on all tables, stored procedures with atomic transactions, and strict schema validation.

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/) + [Vite 7](https://vitejs.dev/)
- **Routing**: [React Router v7](https://reactrouter.com/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **State & Data Fetching**: [TanStack Query v5](https://tanstack.com/query)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Backend / Database**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage, Realtime)
- **Testing**: [Vitest](https://vitest.dev/)
- **Type Safety**: [TypeScript 5](https://www.typescriptlang.org/)

---

## 📁 Repository Structure

```text
├── public/                 # Static assets, fonts, icons
├── raw-assets/             # Original uncompressed artwork
├── scripts/                # Database migrations, RLS verification, asset prep
├── src/
│   ├── assets/             # Optimized WebP, AVIF, and PNG graphics
│   ├── components/         # Reusable UI components, Pokédex drawer, sections
│   ├── hooks/              # Custom React hooks (realtime, event config, timer)
│   ├── lib/                # Database types, Supabase client, IST time engine
│   ├── routes/             # App views (Landing, Auth, Center, Admin suite)
│   └── test/               # Vitest test specifications
└── supabase/
    └── migrations/         # PostgreSQL schema migrations and RLS policies
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v20 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/RyanKeshary/jarivs-3.0-pokemon.git
   cd jarivs-3.0-pokemon
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Populate your Supabase configuration:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

---

## 🧪 Testing & Verification

Run the full verification suite:

```bash
# Run unit & integration tests
npm test

# Run TypeScript compiler checks
npm run typecheck

# Build optimized production bundle
npm run build
```

---

## 📜 License

MIT License. Designed and developed for the Jarvis Hackathon 3.0.
