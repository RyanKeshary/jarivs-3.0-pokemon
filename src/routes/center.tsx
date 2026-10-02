import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useNow } from '../lib/time';
import { useEventConfig } from '../hooks/useEventConfig';
import { useContentBlocks } from '../hooks/useContentBlocks';
import { computeCountdown, formatIstDateTime } from '../lib/time';
import { EditMe } from '../components/ui/EditMe';
import Pokedex from '../components/pokdex/Index';

/**
 * Trainer Dashboard (/center).
 *
 * 2x2 grid layout:
 *   Top-left:    Announcements
 *   Top-right:   Submissions (deck upload / status)
 *   Bottom-left: Status / team info
 *   Bottom-right: empty / reserved
 *
 * On the far right, a Pokédex toggle that displays the trainer's profile and team.
 */
export default function Center() {
  const navigate = useNavigate();
  const [showPokedex, setShowPokedex] = useState(false);
  const now = useNow(1000);
  const eventQuery = useEventConfig();
  const blocksQuery = useContentBlocks();

  // Guard: redirect to /auth if not signed in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/auth', { replace: true });
      }
    });
  }, [navigate]);

  const event = eventQuery.data;
  const blocks = blocksQuery.data;

  if (!event || !blocks) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-900">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-shell-100/15 border-t-ball-500" />
        <span className="sr-only">Loading event</span>
      </div>
    );
  }

  // Countdown
  const countdown = computeCountdown(
    event.countdown_target,
    event.event_ends_at,
    now
  );

  return (
    <div className="relative min-h-screen bg-ink-900 px-5 sm:px-8 py-8">
      {/* Pokédex toggle */}
      <button
        onClick={() => setShowPokedex((prev) => !prev)}
        className="fixed right-6 top-6 z-40 rounded-full border-2 border-ball-500 bg-ball-500/90 px-4 py-2 font-pixel text-xs uppercase text-shell-50 shadow-lg hover:bg-ball-400 transition-colors"
      >
        {showPokedex ? 'Close Pokédex' : 'Pokédex'}
      </button>

      {showPokedex && <Pokedex onClose={() => setShowPokedex(false)} />}

      <h1 className="text-2xl font-bold text-shell-50 sm:text-3xl mb-6 uppercase tracking-wider">
        Kanto League Trainer Dashboard
      </h1>

      {/* Countdown banner */}
      <div className="rounded-card border border-white/10 bg-ink-800/80 p-4 mb-6 text-center">
        <p className="font-pixel text-[0.55rem] text-shell-400 uppercase">
          Countdown to {event.event_name}
        </p>
        <p className="font-pixel text-[1.2rem] text-shell-100 mt-2">
          {formatIstDateTime(event.countdown_target)}
        </p>
        {countdown.valid && (
          <p className="mt-2 font-pixel text-xs text-ball-400">
            {countdown.days}d {countdown.hours}h {countdown.minutes}m {countdown.seconds}s
          </p>
        )}
      </div>

      {/* 2x2 grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
        {/* Top-left: Announcements */}
        <div className="rounded-card border border-white/10 bg-ink-800/80 p-6 h-full">
          <h2 className="font-pixel text-[0.55rem] tracking-[0.15em] text-ball-400 uppercase mb-4">
            Announcements
          </h2>
          <div className="text-shell-200/75 text-sm leading-relaxed">
            <EditMe>Phase 2: announcements will appear here from the dashboard.</EditMe>
          </div>
        </div>

        {/* Top-right: Submissions */}
        <div className="rounded-card border border-white/10 bg-ink-800/80 p-6 h-full">
          <h2 className="font-pixel text-[0.55rem] tracking-[0.15em] text-ball-400 uppercase mb-4">
            Deck Submissions
          </h2>
          <div className="text-shell-200/75 text-sm leading-relaxed">
            <EditMe>Phase 2: submit your PPTX/PPT/PDF deck here.</EditMe>
          </div>
        </div>

        {/* Bottom-left: Status / Team */}
        <div className="rounded-card border border-white/10 bg-ink-800/80 p-6 h-full">
          <h2 className="font-pixel text-[0.55rem] tracking-[0.15em] text-ball-400 uppercase mb-4">
            Team & Status
          </h2>
          <div className="text-shell-200/75 text-sm leading-relaxed">
            <EditMe>Phase 2: view your team and submission status here.</EditMe>
          </div>
        </div>

        {/* Bottom-right: reserved */}
        <div className="rounded-card border border-white/10 bg-ink-800/80 p-6 h-full">
          <h2 className="font-pixel text-[0.55rem] tracking-[0.15em] text-ball-400 uppercase mb-4">
            Prizes & Badges
          </h2>
          <div className="text-shell-200/75 text-sm leading-relaxed">
            <EditMe>Phase 2: tournament badge standings will be showcased here.</EditMe>
          </div>
        </div>
      </div>
    </div>
  );
}