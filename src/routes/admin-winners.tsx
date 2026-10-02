import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNow } from '../lib/time';
import { EditMe } from '../components/ui/EditMe';

/**
 * Admin Winners & Badges.
 *
 * Features:
 * - Select 1st, 2nd, 3rd place teams
 * - Round-completion badge system
 * - Admin defines rounds, marks teams as completing them
 * - "Publish results" toggle
 * - Badges stay hidden until published
 * - Update trainer Pokédex to show gym-badge style medals
 *   and round-completion badges on the profile page
 */
export default function AdminWinners() {
  const [winners, setWinners] = useState<
    {
      id: string;
      first_place_team_id: string | null;
      second_place_team_id: string | null;
      third_place_team_id: string | null;
      published: boolean;
      published_at: string | null;
      created_at: string;
    }[]>([]);

  const [rounds, setRounds] = useState<
    {
      id: string;
      name: string;
      teams_completed: string[]; // team IDs that completed this round
      target_teams: number; // how many teams need to complete it
    }[]>([]);

  const [newRoundName, setNewRoundName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWinnersAndRounds();
  }, []);

  const fetchWinnersAndRounds = async () => {
    try {
      const [winnersData, roundsData] = await Promise.all([
        supabase
          .from('winners') // We might need to create this table, or use existing
          .select('*')
          .order('created_at', { ascending: false }),
        // For now, fetch rounds from a different approach or create them
        supabase.from('teams').select('id, name'),
      ]);

      if (winnersData.error) throw winnersData.error;
      if (roundsData.error) throw roundsData.error;

      setWinners(winnersData.data || []);
      // For Phase 3 initial version, we'll just show the winners table
      // and set up rounds separately
      setRounds([]);
    } catch (error) {
      console.error('Failed to fetch winners and rounds:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePublishResults = async () => {
    try {
      const { error } = await supabase
        .from('winners')
        .update({ published: true, published_at: new Date().toISOString() })
        .eq('id', winners[0]?.id); // Simplified - in full impl, update specific row

      if (error) throw error;
      await fetchWinnersAndRounds();
    } catch (error: any) {
      console.error('Failed to publish results:', error);
    }
  };

  return (
    <div className="p-6 sm:p-8">
      <h2 className="font-pixel text-[0.55rem] tracking-[0.15em] text-ball-400 uppercase mb-6">
        Winners & Badges
      </h2>

      {/* Publish results section */}
      {loading || winners.length === 0 && (
        <p className="text-shell-200/75">
          <EditMe>Phase 3: no winners configuration found.</EditMe>
        </p>
      )}

      <div className="rounded-card border border-white/10 bg-ink-800/80 p-6 mb-8">
        <h3 className="font-pixel text-[0.5rem] tracking-[0.15em] text-ball-400 uppercase mb-4">
          Publish Results
        </h3>

        <p className="text-shell-200/75 mb-4">
          Select which teams placed 1st, 2nd, and 3rd. Badges will remain hidden
          until you toggle "Publish results".
        </p>

        <form onSubmit={(e) => e.preventDefault()}>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="font-pixel text-[0.5rem] tracking-[0.15em] text-shell-400 uppercase mb-1">
                1st Place
              </label>
              <select
                disabled={loading}
                className="mt-1 w-full rounded-xl border border-white/10 bg-ink-950/60 px-4 py-3 text-base text-shell-50 placeholder-text-shell-600 focus:border-ball-400 focus:outline-none"
              >
                <option value="">Select team</option>
                {/* Teams would be populated here */}
              </select>
            </div>

            <div>
              <label className="font-pixel text-[0.5rem] tracking-[0.15em] text-shell-400 uppercase mb-1">
                2nd Place
              </label>
              <select
                disabled={loading}
                className="mt-1 w-full rounded-xl border border-white/10 bg-ink-950/60 px-4 py-3 text-base text-shell-50 placeholder-text-shell-600 focus:border-ball-400 focus:outline-none"
              >
                <option value="">Select team</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="font-pixel text-[0.5rem] tracking-[0.15em] text-shell-400 uppercase mb-1">
                3rd Place
              </label>
              <select
                disabled={loading}
                className="mt-1 w-full rounded-xl border border-white/10 bg-ink-950/60 px-4 py-3 text-base text-shell-50 placeholder-text-shell-600 focus:border-ball-400 focus:outline-none"
              >
                <option value="">Select team</option>
              </select>
            </div>

            <div>
              <label className="font-pixel text-[0.5rem] tracking-[0.15em] text-shell-400 uppercase mb-1">
                Published
              </label>
              <select
                disabled={loading}
                className="mt-1 w-full rounded-xl border border-white/10 bg-ink-950/60 px-4 py-3 text-base text-shell-50 placeholder-text-shell-600 focus:border-ball-400 focus:outline-none"
              >
                <option value="false">Keep hidden</option>
                <option value="true">Publish results</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-4 rounded-full border-2 border-ball-500 bg-ball-500 px-6 py-3 font-pixel text-xs tracking-wider text-shell-50 uppercase transition-colors hover:bg-ball-400 active:bg-ball-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save Winners
          </button>
        </form>
      </div>

      {/* Rounds completion system */}
      <div className="rounded-card border border-white/10 bg-ink-800/80 p-6">
        <h3 className="font-pixel text-[0.5rem] tracking-[0.15em] text-ball-400 uppercase mb-4">
          Round Completion System
        </h3>
        <p className="text-sm text-shell-200/75 mb-4">
          <EditMe>Phase 3: admin defines rounds, marks teams as completing them.</EditMe>
        </p>
        <button
          onClick={() => setNewRoundName('')}
          className="mb-2 rounded-full border-2 border-ball-400 bg-ball-800/50 px-4 py-2 font-pixel text-xs uppercase text-ball-300 hover:bg-ball-400 transition-colors"
        >
          Add New Round
        </button>
      </div>