import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
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

  const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);
  const [firstPlace, setFirstPlace] = useState('');
  const [secondPlace, setSecondPlace] = useState('');
  const [thirdPlace, setThirdPlace] = useState('');
  const [published, setPublished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchWinnersAndTeams();
  }, []);

  const fetchWinnersAndTeams = async () => {
    try {
      const [winnersData, teamsData] = await Promise.all([
        supabase
          .from('winners')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase.from('teams').select('id, name').order('name'),
      ]);

      if (winnersData.data && winnersData.data.length > 0) {
        setWinners(winnersData.data);
        const current = winnersData.data[0];
        setFirstPlace(current.first_place_team_id || '');
        setSecondPlace(current.second_place_team_id || '');
        setThirdPlace(current.third_place_team_id || '');
        setPublished(current.published);
      }
      if (teamsData.data) {
        setTeams(teamsData.data);
      }
    } catch (error) {
      console.error('Failed to fetch winners and teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWinners = async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      const payload = {
        first_place_team_id: firstPlace || null,
        second_place_team_id: secondPlace || null,
        third_place_team_id: thirdPlace || null,
        published,
        published_at: published ? new Date().toISOString() : null,
      };

      if (winners.length > 0) {
        const { error } = await supabase
          .from('winners')
          .update(payload)
          .eq('id', winners[0].id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('winners').insert(payload);
        if (error) throw error;
      }

      await fetchWinnersAndTeams();
      setSaveMessage('Winners saved successfully!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error: any) {
      console.error('Failed to save winners:', error);
      setSaveMessage(error.message || 'Failed to save winners');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 sm:p-8">
      <h2 className="font-pixel text-[0.55rem] tracking-[0.15em] text-ball-400 uppercase mb-6">
        Winners & Badges
      </h2>

      {/* Publish results section */}
      {!loading && winners.length === 0 && (
        <p className="text-shell-200/75 mb-4">
          <EditMe>Phase 3: configure winners below to initialize.</EditMe>
        </p>
      )}

      <div className="rounded-card border border-white/10 bg-ink-800/80 p-6 mb-8">
        <h3 className="font-pixel text-[0.5rem] tracking-[0.15em] text-ball-400 uppercase mb-4">
          Publish Results
        </h3>

        <p className="text-shell-200/75 mb-4">
          Select which teams placed 1st, 2nd, and 3rd. Badges will remain hidden
          until you toggle &quot;Publish results&quot;.
        </p>

        <form onSubmit={(e) => { e.preventDefault(); handleSaveWinners(); }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="font-pixel text-[0.5rem] tracking-[0.15em] text-shell-400 uppercase mb-1">
                1st Place
              </label>
              <select
                disabled={loading}
                value={firstPlace}
                onChange={(e) => setFirstPlace(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-ink-950/60 px-4 py-3 text-base text-shell-50 placeholder-text-shell-600 focus:border-ball-400 focus:outline-none"
              >
                <option value="">Select team</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-pixel text-[0.5rem] tracking-[0.15em] text-shell-400 uppercase mb-1">
                2nd Place
              </label>
              <select
                disabled={loading}
                value={secondPlace}
                onChange={(e) => setSecondPlace(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-ink-950/60 px-4 py-3 text-base text-shell-50 placeholder-text-shell-600 focus:border-ball-400 focus:outline-none"
              >
                <option value="">Select team</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="font-pixel text-[0.5rem] tracking-[0.15em] text-shell-400 uppercase mb-1">
                3rd Place
              </label>
              <select
                disabled={loading}
                value={thirdPlace}
                onChange={(e) => setThirdPlace(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-ink-950/60 px-4 py-3 text-base text-shell-50 placeholder-text-shell-600 focus:border-ball-400 focus:outline-none"
              >
                <option value="">Select team</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-pixel text-[0.5rem] tracking-[0.15em] text-shell-400 uppercase mb-1">
                Published
              </label>
              <select
                disabled={loading}
                value={String(published)}
                onChange={(e) => setPublished(e.target.value === 'true')}
                className="mt-1 w-full rounded-xl border border-white/10 bg-ink-950/60 px-4 py-3 text-base text-shell-50 placeholder-text-shell-600 focus:border-ball-400 focus:outline-none"
              >
                <option value="false">Keep hidden</option>
                <option value="true">Publish results</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-6">
            <button
              type="submit"
              disabled={loading || saving}
              className="rounded-full border-2 border-ball-500 bg-ball-500 px-6 py-3 font-pixel text-xs tracking-wider text-shell-50 uppercase transition-colors hover:bg-ball-400 active:bg-ball-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Winners'}
            </button>
            {saveMessage && (
              <span className="font-pixel text-xs text-emerald-400">{saveMessage}</span>
            )}
          </div>
        </form>
      </div>

      {/* Rounds completion system */}
      <div className="rounded-card border border-white/10 bg-ink-800/80 p-6">
        <h3 className="font-pixel text-[0.5rem] tracking-[0.15em] text-ball-400 uppercase mb-4">
          Round Completion System
        </h3>
        <p className="text-sm text-shell-200/75">
          <EditMe>Phase 3: admin defines rounds, marks teams as completing them.</EditMe>
        </p>
      </div>
    </div>
  );
}