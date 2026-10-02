import { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { EditMe } from '../ui/EditMe';
import { Art } from '../ui/Art';
import { pokedexClose } from '../../lib/assets';

interface PokedexProps {
  onClose?: () => void;
}

/**
 * Pokédex component shown in the side panel of the
 * trainer dashboard. Shows the trainer's profile and team info.
 */
export default function Pokedex({ onClose }: PokedexProps) {
  const [view, setView] = useState<'profile' | 'team'>('profile');
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const trainerDisplayId = session?.user?.email
    ? session.user.email
        .split('@')[0]
        .replace(/[a-z]/g, (c) => {
          const map: Record<string, string> = { a: '4', e: '3', t: '7', o: '0' };
          return map[c] || c;
        })
        .toUpperCase() + '-KNT-2026'
    : '---';

  return (
    <div className="fixed right-5 top-20 z-30 flex flex-col gap-4 w-64 bg-ink-800/95 rounded-xl border border-white/10 p-6 shadow-2xl backdrop-blur-md">
      {/* Header & Close button */}
      <div className="flex items-center justify-between">
        <span className="font-pixel text-[0.6rem] tracking-wider text-ball-400 uppercase">
          Pokédex
        </span>
        <button
          onClick={onClose}
          className="rounded-full p-2 hover:bg-white/10 transition-colors"
          aria-label="Close Pokédex"
        >
          <Art asset={pokedexClose} alt="Close" className="h-5 w-5" />
        </button>
      </div>

      {/* View toggles */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setView('profile')}
          className={`w-full rounded-pixel text-xs font-pixel uppercase ${
            view === 'profile'
              ? 'bg-ball-500 text-shell-50'
              : 'bg-transparent text-ball-300 hover:bg-white/5'
          } px-3 py-1.5 transition-colors`}
          aria-label="View profile"
        >
          Profile
        </button>
        <button
          onClick={() => setView('team')}
          className={`w-full rounded-pixel text-xs font-pixel uppercase ${
            view === 'team'
              ? 'bg-ball-500 text-shell-50'
              : 'bg-transparent text-ball-300 hover:bg-white/5'
          } px-3 py-1.5 transition-colors`}
          aria-label="View team"
        >
          Team
        </button>
      </div>

      {/* Profile view */}
      {view === 'profile' && (
        <div className="mt-4 space-y-4">
          <div>
            <p className="font-pixel text-[0.5rem] text-shell-400 uppercase mb-1">
              Trainer ID
            </p>
            <p className="font-pixel text-sm font-bold text-shell-100 break-all">
              {trainerDisplayId}
            </p>
          </div>

          <div>
            <p className="font-pixel text-[0.5rem] text-shell-400 uppercase mb-1">
              Email
            </p>
            <p className="font-pixel text-xs text-shell-200 break-all">
              {session?.user?.email || 'Not signed in'}
            </p>
          </div>

          <div className="pt-2">
            <EditMe>Phase 2: trainer avatar and stats will appear here.</EditMe>
          </div>
        </div>
      )}

      {/* Team view */}
      {view === 'team' && (
        <div className="mt-4 space-y-4 max-h-80 overflow-y-auto">
          <p className="font-pixel text-[0.5rem] text-shell-400 uppercase">
            Team Members
          </p>
          <div className="text-sm text-shell-200/75">
            <EditMe>Phase 2: team members and roles will appear here.</EditMe>
          </div>
        </div>
      )}
    </div>
  );
}