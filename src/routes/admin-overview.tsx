import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface OverviewStats {
  totalParticipants: number;
  totalTeams: number;
  teamsWithSubmissions: number;
  teamsWithoutSubmissions: number;
  participantsWithoutTeam: number;
  totalSubmissions: number;
  pendingReviews: number;
  acceptedSubmissions: number;
}

interface RecentTrainer {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  trainer_id: string | null;
  created_at: string;
}

interface RecentSubmission {
  id: string;
  team_id: string;
  status: string;
  created_at: string;
  teams?: { name: string } | null;
  problem_statements?: { title: string } | null;
}

export default function AdminOverview() {
  const [stats, setStats] = useState<OverviewStats>({
    totalParticipants: 0,
    totalTeams: 0,
    teamsWithSubmissions: 0,
    teamsWithoutSubmissions: 0,
    participantsWithoutTeam: 0,
    totalSubmissions: 0,
    pendingReviews: 0,
    acceptedSubmissions: 0,
  });

  const [recentTrainers, setRecentTrainers] = useState<RecentTrainer[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<RecentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  const fetchStats = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      // 1. Fetch counts & data in parallel
      const [
        { count: totalParticipants },
        { count: totalTeams },
        { count: participantsWithoutTeam },
        { data: submissionsData },
        { data: trainersData },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('teams').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).is('team_id', null),
        supabase
          .from('submissions')
          .select('id, team_id, status, created_at, teams(name), problem_statements(title)')
          .order('created_at', { ascending: false }),
        supabase
          .from('profiles')
          .select('id, full_name, email, role, trainer_id, created_at')
          .order('created_at', { ascending: false })
          .limit(6),
      ]);

      const totalT = totalTeams ?? 0;
      const allSubs = (submissionsData as unknown as RecentSubmission[]) || [];
      const distinctTeamIds = new Set(allSubs.map((s) => s.team_id).filter(Boolean));
      const teamsWithSubs = distinctTeamIds.size;
      const teamsWithoutSubs = Math.max(0, totalT - teamsWithSubs);
      const pending = allSubs.filter((s) => s.status === 'submitted').length;
      const accepted = allSubs.filter((s) => s.status === 'accepted').length;

      setStats({
        totalParticipants: totalParticipants ?? 0,
        totalTeams: totalT,
        teamsWithSubmissions: teamsWithSubs,
        teamsWithoutSubmissions: teamsWithoutSubs,
        participantsWithoutTeam: participantsWithoutTeam ?? 0,
        totalSubmissions: allSubs.length,
        pendingReviews: pending,
        acceptedSubmissions: accepted,
      });

      setRecentTrainers((trainersData as RecentTrainer[]) || []);
      setRecentSubmissions(allSubs.slice(0, 5));
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial fetch and Realtime subscriptions
  useEffect(() => {
    fetchStats();

    const profileChannel = supabase
      .channel('admin_overview_profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchStats();
      })
      .subscribe();

    const teamChannel = supabase
      .channel('admin_overview_teams')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => {
        fetchStats();
      })
      .subscribe();

    const submissionChannel = supabase
      .channel('admin_overview_submissions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'submissions' }, () => {
        fetchStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(profileChannel);
      supabase.removeChannel(teamChannel);
      supabase.removeChannel(submissionChannel);
    };
  }, [fetchStats]);

  const teamFormationPct =
    stats.totalParticipants > 0
      ? Math.round(((stats.totalParticipants - stats.participantsWithoutTeam) / stats.totalParticipants) * 100)
      : 0;

  const submissionPct =
    stats.totalTeams > 0
      ? Math.round((stats.teamsWithSubmissions / stats.totalTeams) * 100)
      : 0;

  return (
    <div className="p-6 sm:p-8 space-y-8">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-wider text-shell-50 font-display">
              Admin Command Center
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-pixel text-[0.5rem] tracking-wider text-emerald-400 uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Sync
            </span>
          </div>
          <p className="mt-1 text-sm text-shell-200/70">
            Realtime telemetry across trainer registrations, team formations, and project submissions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lastRefreshed && (
            <span className="text-xs text-shell-400 font-mono hidden sm:inline">
              Updated: {lastRefreshed}
            </span>
          )}
          <button
            type="button"
            onClick={() => fetchStats(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-ink-800/80 px-4 py-2 font-pixel text-[0.55rem] uppercase tracking-wider text-shell-200 hover:border-ball-400 hover:text-shell-50 transition-colors disabled:opacity-50"
          >
            <svg
              className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-ball-400' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {refreshing ? 'Syncing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Trainers */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-ink-800/80 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="font-pixel text-[0.52rem] tracking-[0.15em] text-shell-400 uppercase">
              Total Trainers
            </span>
            <span className="rounded-lg bg-ball-500/10 p-2 text-ball-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-shell-50 font-mono">
              {loading ? '...' : stats.totalParticipants}
            </span>
            <span className="text-xs text-shell-400">profiles</span>
          </div>
          <p className="mt-2 text-xs text-shell-400">
            <span className="text-ball-400 font-semibold">{stats.participantsWithoutTeam}</span> free agents unassigned
          </p>
        </div>

        {/* Total Teams */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-ink-800/80 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="font-pixel text-[0.52rem] tracking-[0.15em] text-shell-400 uppercase">
              Formed Teams
            </span>
            <span className="rounded-lg bg-mint-500/10 p-2 text-mint-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-shell-50 font-mono">
              {loading ? '...' : stats.totalTeams}
            </span>
            <span className="text-xs text-shell-400">squads</span>
          </div>
          <p className="mt-2 text-xs text-shell-400">
            <span className="text-mint-400 font-semibold">{stats.teamsWithSubmissions}</span> active submissions
          </p>
        </div>

        {/* Submission Lodged */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-ink-800/80 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="font-pixel text-[0.52rem] tracking-[0.15em] text-shell-400 uppercase">
              Submissions
            </span>
            <span className="rounded-lg bg-amber-500/10 p-2 text-amber-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-shell-50 font-mono">
              {loading ? '...' : stats.teamsWithSubmissions}
            </span>
            <span className="text-xs text-shell-400">/ {stats.totalTeams} teams</span>
          </div>
          <p className="mt-2 text-xs text-shell-400">
            <span className="text-amber-400 font-semibold">{stats.teamsWithoutSubmissions}</span> teams pending upload
          </p>
        </div>

        {/* Review Pipeline */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-ink-800/80 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="font-pixel text-[0.52rem] tracking-[0.15em] text-shell-400 uppercase">
              Pending Reviews
            </span>
            <span className="rounded-lg bg-sky-500/10 p-2 text-sky-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-shell-50 font-mono">
              {loading ? '...' : stats.pendingReviews}
            </span>
            <span className="text-xs text-shell-400">in queue</span>
          </div>
          <p className="mt-2 text-xs text-shell-400">
            <span className="text-emerald-400 font-semibold">{stats.acceptedSubmissions}</span> accepted entries
          </p>
        </div>
      </div>

      {/* Progress & Milestone Meters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Team Formation Meter */}
        <div className="rounded-2xl border border-white/10 bg-ink-800/80 p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="font-pixel text-[0.52rem] tracking-[0.15em] text-shell-400 uppercase">
              Team Formation Rate
            </span>
            <span className="font-mono text-sm font-bold text-mint-400">{teamFormationPct}%</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-ink-950">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-mint-400 transition-all duration-700 ease-out"
              style={{ width: `${teamFormationPct}%` }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-shell-400">
            <span>{stats.totalParticipants - stats.participantsWithoutTeam} assigned</span>
            <span>{stats.participantsWithoutTeam} free agents remaining</span>
          </div>
        </div>

        {/* Submission Milestone Meter */}
        <div className="rounded-2xl border border-white/10 bg-ink-800/80 p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="font-pixel text-[0.52rem] tracking-[0.15em] text-shell-400 uppercase">
              Submission Milestone
            </span>
            <span className="font-mono text-sm font-bold text-ball-400">{submissionPct}%</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-ink-950">
            <div
              className="h-full rounded-full bg-gradient-to-r from-ball-600 to-ball-400 transition-all duration-700 ease-out"
              style={{ width: `${submissionPct}%` }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-shell-400">
            <span>{stats.teamsWithSubmissions} submitted</span>
            <span>{stats.teamsWithoutSubmissions} teams to submit</span>
          </div>
        </div>
      </div>

      {/* Two Column Section: Recent Registrations & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Registered Trainers */}
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-ink-800/80 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-pixel text-[0.55rem] tracking-[0.15em] text-ball-400 uppercase">
              Recent Trainer Registrations
            </h2>
            <Link
              to="/admin/participants"
              className="font-pixel text-[0.5rem] tracking-wider text-shell-400 hover:text-ball-400 uppercase transition-colors"
            >
              View All →
            </Link>
          </div>

          {recentTrainers.length === 0 ? (
            <div className="py-8 text-center text-sm text-shell-400">
              No registered trainers recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 font-pixel text-[0.5rem] tracking-wider text-shell-500 uppercase">
                    <th className="pb-3 pr-4">Trainer ID</th>
                    <th className="pb-3 pr-4">Name</th>
                    <th className="pb-3 pr-4">Email</th>
                    <th className="pb-3 pr-4">Role</th>
                    <th className="pb-3 text-right">Registered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono text-xs">
                  {recentTrainers.map((trainer) => (
                    <tr key={trainer.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 pr-4 text-ball-400 font-semibold">
                        {trainer.trainer_id || 'PENDING'}
                      </td>
                      <td className="py-3 pr-4 font-sans text-shell-100 font-medium">
                        {trainer.full_name || 'Anonymous Trainer'}
                      </td>
                      <td className="py-3 pr-4 text-shell-300">
                        {trainer.email}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-block rounded-md px-2 py-0.5 text-[0.65rem] font-sans uppercase font-bold tracking-wider ${
                            trainer.role === 'admin'
                              ? 'bg-ball-500/20 text-ball-300 border border-ball-500/30'
                              : trainer.role === 'manager'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-ink-950 text-shell-400 border border-white/10'
                          }`}
                        >
                          {trainer.role}
                        </span>
                      </td>
                      <td className="py-3 text-right text-shell-500">
                        {new Date(trainer.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Launch Panel */}
        <div className="rounded-2xl border border-white/10 bg-ink-800/80 p-6 flex flex-col justify-between">
          <div>
            <h2 className="font-pixel text-[0.55rem] tracking-[0.15em] text-ball-400 uppercase mb-4">
              Quick Operations
            </h2>
            <p className="text-xs text-shell-300/70 mb-5">
              Jump directly to specific administrative views and controls.
            </p>

            <div className="space-y-3">
              <Link
                to="/admin/participants"
                className="group flex items-center justify-between rounded-xl border border-white/10 bg-ink-950/60 p-3.5 transition-all hover:border-ball-400/50 hover:bg-ball-500/5"
              >
                <div className="flex items-center gap-3">
                  <span className="rounded-lg bg-ball-500/10 p-2 text-ball-400 group-hover:scale-105 transition-transform">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </span>
                  <div>
                    <p className="font-pixel text-[0.52rem] uppercase tracking-wider text-shell-100 group-hover:text-ball-300">
                      Participants
                    </p>
                    <p className="text-[0.7rem] text-shell-400">View trainers and manage roles</p>
                  </div>
                </div>
                <span className="text-shell-600 group-hover:text-ball-400 transition-colors">→</span>
              </Link>

              <Link
                to="/admin/teams"
                className="group flex items-center justify-between rounded-xl border border-white/10 bg-ink-950/60 p-3.5 transition-all hover:border-mint-400/50 hover:bg-mint-500/5"
              >
                <div className="flex items-center gap-3">
                  <span className="rounded-lg bg-mint-500/10 p-2 text-mint-400 group-hover:scale-105 transition-transform">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </span>
                  <div>
                    <p className="font-pixel text-[0.52rem] uppercase tracking-wider text-shell-100 group-hover:text-mint-300">
                      Teams & Rosters
                    </p>
                    <p className="text-[0.7rem] text-shell-400">Inspect squads and members</p>
                  </div>
                </div>
                <span className="text-shell-600 group-hover:text-mint-400 transition-colors">→</span>
              </Link>

              <Link
                to="/admin/problem-statements"
                className="group flex items-center justify-between rounded-xl border border-white/10 bg-ink-950/60 p-3.5 transition-all hover:border-amber-400/50 hover:bg-amber-500/5"
              >
                <div className="flex items-center gap-3">
                  <span className="rounded-lg bg-amber-500/10 p-2 text-amber-400 group-hover:scale-105 transition-transform">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </span>
                  <div>
                    <p className="font-pixel text-[0.52rem] uppercase tracking-wider text-shell-100 group-hover:text-amber-300">
                      Problem Statements
                    </p>
                    <p className="text-[0.7rem] text-shell-400">Publish and edit tracks</p>
                  </div>
                </div>
                <span className="text-shell-600 group-hover:text-amber-400 transition-colors">→</span>
              </Link>

              <Link
                to="/admin/settings"
                className="group flex items-center justify-between rounded-xl border border-white/10 bg-ink-950/60 p-3.5 transition-all hover:border-sky-400/50 hover:bg-sky-500/5"
              >
                <div className="flex items-center gap-3">
                  <span className="rounded-lg bg-sky-500/10 p-2 text-sky-400 group-hover:scale-105 transition-transform">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </span>
                  <div>
                    <p className="font-pixel text-[0.52rem] uppercase tracking-wider text-shell-100 group-hover:text-sky-300">
                      Settings & Password
                    </p>
                    <p className="text-[0.7rem] text-shell-400">Event deadlines & admin security</p>
                  </div>
                </div>
                <span className="text-shell-600 group-hover:text-sky-400 transition-colors">→</span>
              </Link>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-white/5 bg-ink-950/40 p-3 text-center">
            <span className="font-pixel text-[0.48rem] tracking-wider text-shell-500 uppercase">
              Kanto League OS v3.0
            </span>
          </div>
        </div>
      </div>

      {/* Recent Submissions Feed */}
      <div className="rounded-2xl border border-white/10 bg-ink-800/80 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-pixel text-[0.55rem] tracking-[0.15em] text-ball-400 uppercase">
            Latest Project Submissions
          </h2>
          <span className="font-mono text-xs text-shell-400">
            {stats.totalSubmissions} submissions recorded
          </span>
        </div>

        {recentSubmissions.length === 0 ? (
          <div className="py-6 text-center text-sm text-shell-400">
            No submissions uploaded yet. Teams can upload their projects once Phase 2 submission window opens.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 font-pixel text-[0.5rem] tracking-wider text-shell-500 uppercase">
                  <th className="pb-3 pr-4">Team</th>
                  <th className="pb-3 pr-4">Problem Statement</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 text-right">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-xs">
                {recentSubmissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 pr-4 font-sans text-shell-100 font-semibold">
                      {sub.teams?.name || 'Unnamed Squad'}
                    </td>
                    <td className="py-3 pr-4 text-shell-300">
                      {sub.problem_statements?.title || 'General Challenge'}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-[0.65rem] font-sans uppercase font-bold tracking-wider ${
                          sub.status === 'accepted'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : sub.status === 'rejected'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {sub.status}
                      </span>
                    </td>
                    <td className="py-3 text-right text-shell-500">
                      {new Date(sub.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}