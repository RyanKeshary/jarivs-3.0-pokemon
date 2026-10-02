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

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const { data, error, count } = await supabase
        .from('teams')
        .select('*, profiles!inner (full_name, email)', { count: 'exact' })
        .order('name', { ascending: true });

      if (error) throw error;
      setTeams(data || []);
    } catch (error) {
      console.error('Failed to fetch teams:', error);
    }
  };

  const [openDeleteConfirm, setOpenDeleteConfirm] = useState<'team' | null>(null);
  const [deletingTeamId, setDeletingTeamId] = useState<string | null>(null);

  const confirmDeleteTeam = (teamId: string) => {
    setDeletingTeamId(teamId);
    setOpenDeleteConfirm('team');
  };

  const handleDeleteTeam = async () => {
    if (!deletingTeamId) return;
    try {
      // Delete team - submissions cascade on delete per RLS
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', deletingTeamId);

      if (error) throw error;
      fetchTeams();
    } catch (error) {
      console.error('Failed to delete team:', error);
    } finally {
      setDeletingTeamId(null);
      setOpenDeleteConfirm(null);
    }
  };

  // Fetch submission counts per team
  const [submissionCounts, setSubmissionCounts] = useState<
    Record<string, number>
  >({});

  useEffect(() => {
    fetchSubmissionCounts();
  }, []);

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
                  {/* Count team members from the profiles joined via team_members */}
                  {t.profiles ? t.profiles.length : '—'}
                </td>
                <td className="font-pixel text-sm text-shell-400">
                  {submissionCounts[t.id] || 0} deck(s)
                  {submissionCounts[t.id] ? (
                    <span className="text-xs text-shell-200/75">submitted</span>
                  ) : (
                    <span className="text-xs text-ball-500">not submitted</span>
                  )}
                </td>
                <td className="font-pixel text-sm">
                  <EditMe>Phase 3: view details / manage members</EditMe>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Team detail drawer would go here */}
      <div className="mt-8">
        <h3 className="font-pixel text-[0.5rem] tracking-[0.15em] text-ball-400 uppercase mb-4">
          Team Details
        </h3>
        <p className="text-sm text-shell-200/75">
          <EditMe>Phase 3: team detail drawer with members, submission history, and PPT view.</EditMe>
        </p>
      </div>