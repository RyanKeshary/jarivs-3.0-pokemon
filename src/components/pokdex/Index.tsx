import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useNow } from '../lib/time';
import { EditMe } from '../ui/EditMe';
import { Art } from '../ui/Art';
import { pokedexClose, pokedexOpen } from '../lib/assets';
import { useNow as useNowHook } from 'react';

/**
 * Pokédex component shown in the slim right-side panel of the
 * trainer dashboard. Shows the trainer's profile and team info.
 *
 * Two views:
 *   - "profile": trainer info, trainer ID, team assignment, avatar
 *   - "team": team members list, their roles, trainer IDs
 */
export default function Pokdex() {
  const navigate = useNavigate();
  const [view, setView] = useState<'profile' | 'team'>('profile');
  const now = useNow(5000); // 5s stale, realtime handles updates
  const { data: { session } } = supabase.auth.getSession();

  // Fetch the signed-in trainer's profile
  useEffect(() => {
    if (!session) return;
    // The realtime subscription will keep the UI in sync
  }, [session]);

  return (
    <div className="fixed right-5 top-20 z-30 flex flex-col gap-4 w-48 bg-ink-800/90 rounded-xl border border-white/10 p-6 shadow-lg">
      {/* Close button */}
      <button
        onClick={() => setView('profile')}
        className="rounded-full p-2 hover:bg-white/5 transition-colors"
        aria-label="Close Pokédex"
      >
        <Art
          asset={pokedexClose}
          alt="Close"
          className="h-5 w-5"
        />
      </button>

      {/* View toggles */}
      <button
        onClick={() => setView('profile')}
        className={`w-full rounded-pixel text-xs font-pixel uppercase text-ball-300 ${
          view === 'profile' ? 'bg-ball-500 text-shell-50' : 'bg-translent'
        } px-3 py-1.5 hover:bg-ball-400 transition-colors`}
        aria-label="View profile"
      >
        Profile
      </button>
      <button
        onClick={() => setView('team')}
        className={`w-full rounded-pixel text-xs font-pixel uppercase text-ball-300 ${
          view === 'team' ? 'bg-ball-500 text-shell-50' : 'bg-translent'
        } px-3 py-1.5 hover:bg-ball-400 transition-colors`}
        aria-label="View team"
      >
        Team
      </button>

      {/* --- Profile view --- */}
      {view === 'profile' && (
        <div className="mt-6 space-y-4">
          {/* Trainer ID */}
          <div>
            <p className="font-pixel text-[0.5rem] text-shell-400 uppercase mb-1">
              Trainer ID
            </p>
            <p className="font-pixel text-[1.2rem] font-bold text-shell-100">
              {session?.user?.email?.split('@')[0]
                ?.replace(/[a-z]/g, c => {
                  const map: Record<string, string> = {
                    a: '4', e: '3', t: '7', o: '0',
                  };
                  return map[c] || c;
                }) || '---'}
              -KNT-2026-XXXX
            </p>
          </div>

          {/* Avatar */}
          <div className="flex justify-center">
            <img
              src={session?.user?.avatar || '/placeholder-avatar.png'}
              alt="Trainer avatar"
              className="h-20 w-20 rounded-full object-cover border-2 border-ball-500"
            />
          </div>

          {/* Team info */}
          <EditMe>Phase 2: your team and trainer details will appear here.</EditMe>
        </div>
      )}

      {/* --- Team view --- */}
      {view === 'team' && (
        <div className="mt-6 space-y-4 max-h-80 overflow-y-auto">
          <p className="font-pixel text-[0.5rem] text-shell-400 uppercase">
            Team Members
          </p>
          <p className="text-sm text-shell-200/75">
            <EditMe>Phase 2: team members will appear here.</EditMe>
          </p>
          <p className="text-sm text-shell-200/75">
            Team size: 0 / {session?.user?.trainer_id ? '---' : '---'}
          </p>
        </div>
      )}
    </div>
  );
}