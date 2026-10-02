import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNow } from '../lib/time';
import { EditMe } from '../components/ui/EditMe';

/**
 * Admin Announcements Manager.
 *
 * Features:
 * - Create, edit, delete announcements
 * - Appear live on trainers' dashboards via Realtime
 * - Rich text content (simplified as markdown/plain text for now)
 * - Timestamp tracking
 */
export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState<
    {
      id: string;
      title: string;
      body: string;
      created_at: string;
    }[]>([]);

  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const { error } = await supabase.from('announcements').insert({
        title: newTitle,
        body: newBody || '',
      });

      if (error) throw error;
      await fetchAnnouncements();
      setNewTitle('');
      setNewBody('');
    } catch (error: any) {
      console.error('Failed to create announcement:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('announcements').delete().eq('id', id);
      if (error) throw error;
      await fetchAnnouncements();
    } catch (error: any) {
      console.error('Failed to delete announcement:', error);
    }
  };

  const handleToggle = async (id: string) => {
    // In a full implementation, we'd have an 'active' toggle
    // For now, just refresh
    await fetchAnnouncements();
  };

  return (
    <div className="p-6 sm:p-8">
      <h2 className="font-pixel text-[0.55rem] tracking-[0.15em] text-ball-400 uppercase mb-6">
        Announcements
      </h2>

      {/* Create announcement form */}
      <div className="rounded-card border border-white/10 bg-ink-800/80 p-6 mb-8">
        <h3 className="font-pixel text-[0.5rem] tracking-[0.15em] text-ball-400 uppercase mb-4">
          Create New Announcement
        </h3>

        <form>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="font-pixel text-[0.5rem] tracking-[0.15em] text-shell-400 uppercase mb-1">
                Title
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Important schedule change"
                className="mt-1 w-full rounded-xl border border-white/10 bg-ink-950/60 px-4 py-3 text-base text-shell-50 placeholder-text-shell-600 focus:border-ball-400 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="font-pixel text-[0.5rem] tracking-[0.15em] text-shell-400 uppercase mb-1">
                Body
              </label>
              <input
                type="text"
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
                placeholder="Announcement content..."
                className="mt-1 w-full rounded-xl border border-white/10 bg-ink-950/60 px-4 py-3 text-base text-shell-50 placeholder-text-shell-600 focus:border-ball-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-4">
            <button
              type="submit"
              className="rounded-full border-2 border-ball-500 bg-ball-500 px-6 py-3 font-pixel text-xs tracking-wider text-shell-50 uppercase transition-colors hover:bg-ball-400 active:bg-ball-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Publish Announcement
            </button>
            <button
              type="button"
              onClick={() => setNewTitle(''), setNewBody('')}
              className="mt-2 rounded-full border-2 border-ball-400 bg-ball-800/50 px-4 py-2 font-pixel text-xs uppercase text-ball-300 hover:bg-ball-400 transition-colors"
            >
              Cancel
            </button>
          </form>
        </div>

        {/* Existing announcements list */}
        {announcements.length === 0 && !loading && (
          <p className="text-shell-200/75">
            <EditMe>Phase 3: no announcements found.</EditMe>
          </p>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="font-pixel text-[0.5rem] text-shell-400 uppercase text-left">
                  Title
                </th>
                <th className="font-pixel text-[0.5rem] text-shell-400 uppercase text-left">
                  Created
                </th>
                <th className="font-pixel text-[0.5rem] text-shell-400 uppercase text-left">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {announcements.map((a) => (
                <tr key={a.id} className="border-b border-white/10 hover:bg-ink-950/50">
                  <td className="font-pixel text-sm text-shell-500">{a.title}</td>
                  <td className="font-pixel text-sm text-shell-400">
                    {new Date(a.created_at).toLocaleDateString()}
                  </td>
                  <td className="font-pixel text-sm">
                    <EditMe>Phase 3: edit / delete</EditMe>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Real-time note */}
      <div className="mt-8 p-6 rounded-card border ball-400/30 bg-ball-500/10">
        <p className="font-pixel text-[0.5rem] text-ball-400 uppercase mb-2">
          Live on dashboards
        </p>
        <p className="font-pixel text-shell-200/75">
          <EditMe>Phase 3: announcements appear on trainers' dashboards via realtime subscription automatically.</EditMe>
        </p>
      </div>