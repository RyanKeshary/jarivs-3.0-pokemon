import { redirect } from 'next/navigation';
import { LandingClient } from '@/components/landing/LandingClient';
import { sql } from '@/lib/supabase/admin';
import type { EventSettings } from '@/lib/database.types';

export const revalidate = 60; // Revalidate every 60 seconds

async function getEventSettings(): Promise<EventSettings> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://oqqzzyombtcjvlqbjvla.supabase.co';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_QMmz5ZNtmwnZssxC6KnH1g_zoRZ6FIr';

  // 1. Fast HTTPS fetch over port 443 with 2.5s abort timeout (works reliably on Render, Vercel, edge)
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(`${supabaseUrl}/rest/v1/event_settings?id=eq.1&select=*`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      next: { revalidate: 60 },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.ok) {
      const rows = await res.json();
      if (Array.isArray(rows) && rows.length > 0) {
        return rows[0] as EventSettings;
      }
    }
  } catch (err) {
    // REST attempt timed out or failed, try direct postgres fallback with fast timeout
  }

  // 2. Direct Postgres fallback with strict 2s race timeout
  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Postgres query timeout')), 2000)
    );

    const queryPromise = sql`
      SELECT 
        id, 
        name, 
        tagline, 
        deadline::text as deadline, 
        countdown_target::text as countdown_target, 
        registration_deadline::text as registration_deadline, 
        min_team_size, 
        max_team_size, 
        brochure_url, 
        ppt_template_url, 
        landing_content, 
        updated_at::text as updated_at
      FROM public.event_settings 
      WHERE id = 1
    `;

    const rows = (await Promise.race([queryPromise, timeoutPromise])) as any[];
    if (rows && rows.length > 0) {
      return rows[0] as unknown as EventSettings;
    }
  } catch (err) {
    // Continue directly to hardcoded fallback defaults
  }

  // Fallback defaults for Indigo Tech Fest · Jarvis 3.0
  return {
    id: 1,
    name: 'Indigo Tech Fest · Jarvis 3.0',
    tagline: 'Six Disciplines of Intellect, Robotics & Algorithmic Craft',
    deadline: '2026-10-17T18:00:00+05:30',
    countdown_target: '2026-10-16T09:00:00+05:30',
    registration_deadline: '2026-10-15T23:59:59+05:30',
    min_team_size: 1,
    max_team_size: 4,
    brochure_url: '/assets/placeholders/brochure.pdf',
    ppt_template_url: '/assets/placeholders/template.pptx',
    landing_content: {
      venue: 'SLRTCE Campus, Mira Road, Mumbai',
      prizes: [],
      tracks: [
        { name: 'Hardware & Systems Architecture', desc: 'Working prototypes and embedded robotics.' },
        { name: 'Algorithmic Tournaments', desc: 'Computational reasoning and speed coding.' },
        { name: 'Mechanical & Parametric CAD', desc: 'Precision modeling and stress analysis.' },
        { name: 'Documentary Storytelling', desc: 'Cinematic reel chronicles of engineering tension.' },
      ],
      rules: [
        'All work must adhere to festival honesty and academic integrity standards.',
        'Teams can comprise 1 to 4 members based on event category.',
        'Schedule conflicts across concurrent events must be avoided.',
      ],
      eligibility: 'Open to collegiate and university engineering students.',
      timeline: [
        { title: 'Poké Expo', desc: 'Hardware apparatus demonstrations and software project benches', phase: 'day1' },
        { title: 'PID-Geotto — Line Follower Race', desc: 'Autonomous wheeled robotics race', phase: 'day1' },
        { title: 'PokéQuest — Treasure Hunt', desc: 'Campus riddle challenge and clue tracking', phase: 'day1' },
        { title: 'Quiz-tle — Tech Knowledge Tournament', desc: 'Technical quiz preliminary rounds', phase: 'day1' },
        { title: 'Builda-Saur — Hackathon', desc: 'Day 1 innovation hackathon kickoff', phase: 'day1' },
        { title: 'Snorreelax — Reel Making Competition', desc: 'Short-form documentary digital reels', phase: 'day1' },
        { title: 'Quiz-tle — Tech Knowledge Tournament', desc: 'Top finalist duos live on stage buzzer finals', phase: 'day2' },
        { title: 'Builda-Saur — Hackathon', desc: 'Round 2 final debugging & prototype defense', phase: 'day2' },
        { title: 'CAD-Mander — Parametric CAD Drafting & 2D Solid Assembly', desc: '2D AutoCAD engineering blueprints competition', phase: 'day2' },
      ],
    },
    updated_at: new Date().toISOString(),
  };
}

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = searchParams ? await searchParams : {};
  if (params.code && typeof params.code === 'string') {
    redirect(`/auth/callback?code=${encodeURIComponent(params.code)}&next=/auth?mode=update-password`);
  }

  const settings = await getEventSettings();
  return <LandingClient settings={settings} />;
}
