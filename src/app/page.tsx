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

  // Fallback defaults
  return {
    id: 1,
    name: 'Kento League · Jarvis Hackathon 3.0',
    tagline: 'Where Code Meets the Pokémon League — Build, Battle, and Level Up!',
    deadline: '2026-10-18T18:00:00+05:30',
    countdown_target: '2026-10-18T09:00:00+05:30',
    registration_deadline: '2026-10-17T23:59:59+05:30',
    min_team_size: 1,
    max_team_size: 4,
    brochure_url: '/assets/placeholders/brochure.pdf',
    ppt_template_url: '/assets/placeholders/template.pptx',
    landing_content: {
      venue: 'SLRTCE Campus, Mira Road, Mumbai / Virtual Hybrid Arena',
      prizes: [
        { place: '1st Place (Champion)', amount: '₹50,000 + Trophy + Pokéball Swag Pack' },
        { place: '2nd Place (Elite Four)', amount: '₹25,000 + Medal + Tech Goodies' },
        { place: '3rd Place (Gym Leader)', amount: '₹15,000 + Certificate + Perks' },
      ],
      tracks: [
        { name: 'AI & GenAI Battle Arena', desc: 'Agentic systems, LLM copilots, automated battle intelligences.' },
        { name: 'Web3 & Decentralized Gyms', desc: 'Smart contracts, on-chain trainer badges, verifiable credentials.' },
        { name: 'IoT & Smart Poké-Devices', desc: 'Hardware hacks, edge devices, smart campus sensors.' },
        { name: 'Open Innovation', desc: 'High impact solutions for real-world municipal & collegiate challenges.' },
      ],
      rules: [
        'All code must be written during the hackathon hours.',
        'Teams can comprise 1 to 4 trainers from @slrtce.in domain.',
        'Plagiarism or pre-built code will result in immediate disqualification.',
        'Submissions require a presentation PPT/PDF and GitHub repository.',
      ],
      eligibility: 'Open to all engineering students with an active @slrtce.in institutional email id.',
      timeline: [
        { time: '09:00 AM', title: 'Opening Ceremony & Keynote', desc: 'Pallet Town Kickoff at the Main Auditorium', phase: 'day1' },
        { time: '10:30 AM', title: 'Hackathon Begins & Problem Release', desc: 'Gym Battles Open! Teams start building', phase: 'day1' },
        { time: '01:00 PM', title: 'Mid-Day Energy Fuel', desc: 'Lunch & Poké-Snack breaks', phase: 'day1' },
        { time: '05:00 PM', title: 'Mentorship Checkpoint 1', desc: 'Professor Oak reviews trainer progress', phase: 'day1' },
        { time: '11:00 PM', title: 'Midnight Mini-Challenge', desc: 'Speed coding mini-battle for bonus swag', phase: 'day1' },
        { time: '08:00 AM', title: 'Morning Checkpoint 2', desc: 'Final sprint & debugging round', phase: 'day2' },
        { time: '02:00 PM', title: 'Submission Lock', desc: 'All PPT and code repos locked for judging', phase: 'day2' },
        { time: '04:30 PM', title: 'Grand Finale & Champion Crowning', desc: 'League Champions announced and prizes awarded', phase: 'day2' },
      ],
    },
    updated_at: new Date().toISOString(),
  };
}

export default async function HomePage() {
  const settings = await getEventSettings();
  return <LandingClient settings={settings} />;
}
