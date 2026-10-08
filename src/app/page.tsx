import { redirect } from 'next/navigation';
import { LandingClient } from '@/components/landing/LandingClient';
import { sql } from '@/lib/supabase/admin';
import type { EventSettings } from '@/lib/database.types';

export const revalidate = 60; // Revalidate every 60 seconds

async function getEventSettings(): Promise<EventSettings> {
  try {
    const rows = await sql`
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

    if (rows && rows.length > 0) {
      return rows[0] as unknown as EventSettings;
    }
  } catch (err) {
    console.error('Failed to load event settings from DB, using fallback:', err);
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
      prizes: [
        { place: 'Build-asor Champion', amount: '₹25,000 + Champion Crests' },
        { place: 'Project Exhibition 1st', amount: '₹15,000 + Distinction' },
        { place: 'PID-geotto 1st', amount: '₹12,000 + Robotic Trophy' },
        { place: 'Cad-Mander 1st', amount: '₹10,000 + Gold Medal' },
        { place: 'Quiz-tle 1st', amount: '₹10,000 + Rolling Cup' },
        { place: 'reelax 1st', amount: '₹8,000 + Fest Laurels' },
      ],
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
        { time: '09:00 AM', title: 'Opening Convocation', desc: 'Auditorium Kickoff', phase: 'day1' },
        { time: '10:00 AM', title: 'Disciplines Commenced', desc: 'Exhibition and Buildathon start', phase: 'day1' },
        { time: '01:30 PM', title: 'PID-geotto Robot Arena', desc: 'Line follower trials', phase: 'day1' },
        { time: '09:00 AM', title: 'Air-Gapped Synthesis', desc: 'Day 2 offline sprint', phase: 'day2' },
        { time: '03:30 PM', title: 'Grand Valedictory', desc: 'Awards ceremony', phase: 'day2' },
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
