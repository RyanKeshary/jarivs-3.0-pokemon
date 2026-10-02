import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { EditMe } from '../components/ui/EditMe';

/**
 * Admin Participants Table.
 *
 * Features:
 * - Search by name or email
 * - Filter by team status (has team, no team)
 * - Sort by name, email, trainer ID, join date
 * - Pagination
 * - CSV export
 * - Inline role display
 *
 * Columns: Name, Email, Mobile, Trainer ID, Team, Role
 */
export default function AdminParticipants() {
  const [participants, setParticipants] = useState<
    { id: string; email: string; full_name: string | null; roll_no: string | null; year: string | null; branch: string | null; role: string; team_id: string | null }[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'has-team' | 'no-team'>('all');
  const [sort, setSort] = useState<'name' | 'email' | 'trainer-id' | 'join-date'>('name');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  useEffect(() => {
    fetchParticipants();
  }, [search, filter, sort, page]);

  const fetchParticipants = async () => {
    try {
      let query = supabase
        .from('profiles')
        .select(
          `
          *,
          teams (id, name)
        `,
        )
        .order(sort, { ascending: true });

      // Apply search filter
      if (search) {
        query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      // Apply team filter
      if (filter === 'has-team') {
        query = query.isNot('team_id', null);
      } else if (filter === 'no-team') {
        query = query.is('team_id', null);
      }

      const { data, error, count } = await query.range(
        (page - 1) * pageSize,
        page * pageSize - 1,
      );

      if (error) throw error;

      setParticipants(data || []);
    } catch (error) {
      console.error('Failed to fetch participants:', error);
    }
  };

  const handleCSVExport = async () => {
    try {
      // Fetch all participants without pagination limits
      const { data, error } = await supabase
        .from('profiles')
        .select(
          `
          id,
          email,
          full_name,
          roll_no,
          team_id,
          role,
          created_at
        `,
          { count: 'exact' },
        );

      if (error) throw error;

      if (!data || data.length === 0) {
        alert('No participant data to export.');
        return;
      }

      // Build CSV
      const headers = ['Name', 'Email', 'Trainer ID', 'Team', 'Role', 'Registered'];
      const rows = data.map((p: any) => [
        p.full_name || '',
        p.email,
        p.trainer_id || '—',
        p.teams?.name || '—',
        p.role,
        new Date(p.created_at).toLocaleDateString(),
      ]);

      // Format CSV
      const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
      ].join('\n');

      // Trigger download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `participants-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('CSV export failed:', error);
      alert('Failed to export CSV. Check console for details.');
    }
  };

  return (
    <div className="p-6 sm:p-8">
      <h2 className="font-pixel text-[0.55rem] tracking-[0.15em] text-ball-400 uppercase mb-6">
        Participants
      </h2>

      {/* Toolbar: search, filter, export */}
      <div className="rounded-card border border-white/10 bg-ink-800/80 p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 sm:flex-1">
          <label
            className="font-pixel text-[0.5rem] tracking-[0.15em] text-shell-400 uppercase mb-1 block"
          >
            Search by name or email
          </label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type to search..."
            className="mt-1 flex-1 rounded-xl border border-white/10 bg-ink-950/60 px-3 py-2 text-sm text-shell-50 placeholder-text-shell-600 focus:border-ball-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <label
            className="font-pixel text-[0.5rem] tracking-[0.15em] text-shell-400 uppercase mb-0"
          >
            Filter:
          </label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="rounded-xl border border-white/10 bg-ink-950/60 px-3 py-2 text-sm text-shell-50 placeholder-text-shell-600 focus:border-ball-400 focus:outline-none"
          >
            <option value="all">All</option>
            <option value="has-team">Has a team</option>
            <option value="no-team">No team</option>
          </select>
        </div>

        <button
          onClick={handleCSVExport}
          className="rounded-full border-2 border-ball-500 bg-ball-800/50 px-4 py-2 font-pixel text-xs text-ball-300 uppercase hover:bg-ball-400 transition-colors"
        >
          Export CSV
        </button>
      </div>

      {/* Table */}
      {participants.length === 0 && (
        <p className="text-shell-200/75">
          <EditMe>Phase 3: no participants found. Ensure trainers have registered.</EditMe>
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="font-pixel text-[0.5rem] text-shell-400 uppercase text-left">Name</th>
              <th className="font-pixel text-[0.5rem] text-shell-400 uppercase text-left">Email</th>
              <th className="font-pixel text-[0.5rem] text-shell-400 uppercase text-left">Trainer ID</th>
              <th className="font-pixel text-[0.5rem] text-shell-400 uppercase text-left">Team</th>
              <th className="font-pixel text-[0.5rem] text-shell-400 uppercase text-left">Role</th>
              <th className="font-pixel text-[0.5rem] text-shell-400 uppercase text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {participants.map((p) => (
              <tr key={p.id} className="border-b border-white/10 hover:bg-ink-950/50">
                <td className="font-pixel text-sm text-shell-500">
                  {p.full_name || p.email.split('@')[0]}
                </td>
                <td className="font-pixel text-sm text-shell-400">{p.email}</td>
                <td className="font-pixel text-sm text-shell-400">
                  {p.trainer_id || '—'}
                </td>
                <td className="font-pixel text-sm text-shell-400">
                  {p.teams?.name || (p.team_id ? '—' : '<span className="text-ball-500">—</span>')}
                </td>
                <td className="font-pixel text-sm text-shell-400">
                  {p.role}
                </td>
                <td className="font-pixel text-sm">
                  <EditMe>Phase 3: view/edit details</EditMe>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {participants.length > 0 && (
        <div className="mt-6">
          <p className="font-pixel text-[0.5rem] text-shell-400">
            Page {page} of{Math.ceil((count ?? participants.length) / pageSize)}
          </p>
        </div>
      )}