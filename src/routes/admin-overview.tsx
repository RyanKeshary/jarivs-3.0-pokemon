import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { EditMe } from '../components/ui/EditMe';

/**
 * Admin Overview Dashboard.
 *
 * Live-updating counts via Realtime subscriptions.
 * Shows:
 *   - Total participants
 *   - Total teams
 *   - Teams with submissions
 *   - Teams without submissions
 *   - Participants without a team
 *   - Registrations over time (simple chart data)
 */
export default function AdminOverview() {
  const [stats, setStats] = useState({
    totalParticipants: 0,
    totalTeams: 0,
    teamsWithSubmissions: 0,
    teamsWithoutSubmissions: 0,
    participantsWithoutTeam: 0,
    registrationsOverTime: [] as { date: string; count: number }[],
  });

  // Initial data fetch
  useEffect(() => {
    fetchStats();
    const cleanup = setupRealtime();
    return () => {
      cleanup();
    };
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch counts from database
      const [
        { count: totalParticipants },
        { count: totalTeams },
        { count: teamsWithSubmissions },
        { count: teamsWithoutSubmissions },
        { count: participantsWithoutTeam },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('teams').select('*', { count: 'exact', head: true }),
        supabase.from('submissions').select('team_id', { count: 'exact', head: true }),
        // Teams with at least one submission
        supabase
          .from('submissions')
          .select('team_id', { count: 'exact', head: true })
          .not('team_id', 'is', null),
        // Profiles with no team_id
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .is('team_id', null),
      ]);

      setStats({
        totalParticipants: totalParticipants ?? 0,
        totalTeams: totalTeams ?? 0,
        teamsWithSubmissions: teamsWithSubmissions ?? 0,
        teamsWithoutSubmissions: teamsWithoutSubmissions ?? 0,
        participantsWithoutTeam: participantsWithoutTeam ?? 0,
        registrationsOverTime: [],
      });
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
    }
  };

  const setupRealtime = () => {
    // Subscribe to profile changes (participant count)
    const profileSubscription = supabase
      .channel('admin_stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchStats();
      })
      .subscribe();

    // Subscribe to team changes
    const teamSubscription = supabase
      .channel('admin_teams')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => {
        fetchStats();
      })
      .subscribe();

    // Subscribe to submission changes
    const submissionSubscription = supabase
      .channel('admin_submissions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'submissions' }, () => {
        fetchStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(profileSubscription);
      supabase.removeChannel(teamSubscription);
      supabase.removeChannel(submissionSubscription);
    };
  };

  return (
    <div className="p-6 sm:p-8">
      <h2 className="font-pixel text-[0.55rem] tracking-[0.15em] text-ball-400 uppercase mb-6">
        Admin Overview
      </h2>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="rounded-card border border-white/10 bg-ink-800/80 p-6">
          <p className="font-pixel text-[0.5rem] text-shell-400 uppercase mb-2">Total Participants</p>
          <p className="font-pixel text-4xl font-bold text-shell-100">{stats.totalParticipants}</p>
        </div>

        <div className="rounded-card border border-white/10 bg-ink-800/80 p-6">
          <p className="font-pixel text-[0.5rem] text-shell-400 uppercase mb-2">Total Teams</p>
          <p className="font-pixel text-4xl font-bold text-shell-100">{stats.totalTeams}</p>
        </div>

        <div className="rounded-card border border-white/10 bg-ink-800/80 p-6">
          <p className="font-pixel text-[0.5rem] text-shell-400 uppercase mb-2">Teams with Submissions</p>
          <p className="font-pixel text-4xl font-bold text-shell-100">{stats.teamsWithSubmissions}</p>
        </div>

        <div className="rounded-card border border-white/10 bg-ink-800/80 p-6">
          <p className="font-pixel text-[0.5rem] text-shell-400 uppercase mb-2">Teams without Submissions</p>
          <p className="font-pixel text-4xl font-bold text-shell-100">{stats.teamsWithoutSubmissions}</p>
        </div>
      </div>

      <div className="rounded-card border border-white/10 bg-ink-800/80 p-6">
        <p className="font-pixel text-[0.5rem] text-shell-400 uppercase mb-2">Participants Without a Team</p>
        <p className="font-pixel text-4xl font-bold text-shell-100">{stats.participantsWithoutTeam}</p>
        <p className="mt-2 text-sm text-shell-200/75">
          <EditMe>Phase 3: this count updates in realtime.</EditMe>
        </p>
      </div>

      {/* Registrations over time summary */}
      <div className="mt-8">
        <h3 className="font-pixel text-[0.5rem] tracking-[0.15em] text-ball-400 uppercase mb-4">
          Recent Registrations
        </h3>
        <p className="text-sm text-shell-200/75">
          <EditMe>Phase 3: chart data will be populated from auth.users signup timestamps.</EditMe>
        </p>
      </div>
    </div>
  );
}