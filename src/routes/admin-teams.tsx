import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { EditMe } from '../components/ui/EditMe';

/**
 * Admin Teams Table.
 *
 * Features:
 * - Show team ID, name, join code, member count, submission status
 * - Team detail drawer with all members and contact info
 * - Submission history/versions
 * - "View PPT" button (opens via short-lived signed URL)
 * - Remove a member or delete a team (with confirmation)
 * - Pagination and search
 */
export default function AdminTeams() {
  const [teams, setTeams] = useState<
    {
      id: string;
      name: string;
      join_code: string;
      max_members: number;
      leader_id: string | null;
      created_at: string;
    }[]>([]);

  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const [submissionCounts, setSubmissionCounts] = useState<Record<string, number>>({});
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState<'team' | null>(null);
  const [deletingTeamId, setDeletingTeamId] = useState<string | null>(null);

  useEffect(() => {
    fetchTeams();
    fetchSubmissionCounts();
  }, []);

  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setTeams(data || []);

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('team_id')
        .not('team_id', 'is', null);

      if (profilesData) {
        const counts: Record<string, number> = {};
        profilesData.forEach((p: any) => {
          if (p.team_id) {
            counts[p.team_id] = (counts[p.team_id] || 0) + 1;
          }
        });
        setMemberCounts(counts);
      }
    } catch (error) {
      console.error('Failed to fetch teams:', error);
    }
  };

  const confirmDeleteTeam = (teamId: string) => {
    setDeletingTeamId(teamId);
    setOpenDeleteConfirm('team');
  };

  const handleDeleteTeam = async () => {
    if (!deletingTeamId) return;
    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', deletingTeamId);

      if (error) throw error;
      await fetchTeams();
    } catch (error) {
      console.error('Failed to delete team:', error);
    } finally {
      setDeletingTeamId(null);
      setOpenDeleteConfirm(null);
    }
  };

  const fetchSubmissionCounts = async () => {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('team_id')
        .not('team_id', 'is', null);

      if (error) throw error;

      const counts: Record<string, number> = {};
      (data || []).forEach((s: any) => {
        counts[s.team_id] = (counts[s.team_id] || 0) + 1;
      });
      setSubmissionCounts(counts);
    } catch (error) {
      console.error('Failed to fetch submission counts:', error);
    }
  };

  return (
    <div className="p-6 sm:p-8">
      <h2 className="font-pixel text-[0.55rem] tracking-[0.15em] text-ball-400 uppercase mb-6">
        Teams
      </h2>

      {/* Table */}
      {teams.length === 0 && (
        <p className="text-shell-200/75">
          <EditMe>Phase 3: no teams found.</EditMe>
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="font-pixel text-[0.5rem] text-shell-400 uppercase text-left">
                Team ID
              </th>
              <th className="font-pixel text-[0.5rem] text-shell-400 uppercase text-left">
                Team Name
              </th>
              <th className="font-pixel text-[0.5rem] text-shell-400 uppercase text-left">
                Join Code
              </th>
              <th className="font-pixel text-[0.5rem] text-shell-400 uppercase text-left">
                Members
              </th>
              <th className="font-pixel text-[0.5rem] text-shell-400 uppercase text-left">
                Submission Status
              </th>
              <th className="font-pixel text-[0.5rem] text-shell-400 uppercase text-left">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {teams.map((t) => (
              <tr key={t.id} className="border-b border-white/10 hover:bg-ink-950/50">
                <td className="font-pixel text-sm text-shell-400">{t.id}</td>
                <td className="font-pixel text-sm text-shell-500">
                  {t.name}
                </td>
                <td className="font-pixel text-sm text-shell-400">
                  {t.join_code}
                </td>
                <td className="font-pixel text-sm text-shell-400">
                  {memberCounts[t.id] ?? 0}
                </td>
                <td className="font-pixel text-sm text-shell-400">
                  {submissionCounts[t.id] || 0} deck(s)
                  {submissionCounts[t.id] ? (
                    <span className="ml-1 text-xs text-shell-200/75">submitted</span>
                  ) : (
                    <span className="ml-1 text-xs text-ball-500">not submitted</span>
                  )}
                </td>
                <td className="font-pixel text-sm">
                  <button
                    type="button"
                    onClick={() => confirmDeleteTeam(t.id)}
                    className="text-xs text-rose-400 hover:text-rose-300 underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {openDeleteConfirm === 'team' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-ink-900 p-6 shadow-2xl">
            <h3 className="font-pixel text-sm text-rose-400 mb-2">Delete Team</h3>
            <p className="text-sm text-shell-300 mb-6">
              Are you sure you want to delete this team? All associated submissions and memberships will be affected.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setOpenDeleteConfirm(null);
                  setDeletingTeamId(null);
                }}
                className="rounded-lg border border-white/20 px-4 py-2 text-xs font-pixel text-shell-300 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteTeam}
                className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-pixel text-white hover:bg-rose-500"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Team detail drawer placeholder */}
      <div className="mt-8">
        <h3 className="font-pixel text-[0.5rem] tracking-[0.15em] text-ball-400 uppercase mb-4">
          Team Details
        </h3>
        <p className="text-sm text-shell-200/75">
          <EditMe>Phase 3: team detail drawer with members, submission history, and PPT view.</EditMe>
        </p>
      </div>
    </div>
  );
}