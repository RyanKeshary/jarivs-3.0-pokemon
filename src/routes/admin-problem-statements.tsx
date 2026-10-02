import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNow } from '../lib/time';
import { EditMe } from '../components/ui/EditMe';

/**
 * Admin Problem Statements Manager.
 *
 * Features:
 * - Upload problem statement (file + title + description)
 * - Delete problem statement
 * - Visible / Private toggle
 * - Trainers only ever see visible ones (RLS enforcement)
 * - Optional scheduled reveal time
 *
 * All data stored in public.problem_statements table.
 */
export default function AdminProblemStatements() {
  const [problemStatements, setProblemStatements] = useState<
    {
      id: string;
      title: string;
      description: string;
      visible: boolean;
      file_path: string | null;
      scheduled_reveal: string | null;
      created_at: string;
    }[]>([]);

  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newVisible, setNewVisible] = useState(true);
  const [newScheduledReveal, setNewScheduledReveal] = useState<Date | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProblemStatements();
  }, []);

  const fetchProblemStatements = async () => {
    try {
      const { data, error } = await supabase
        .from('problem_statements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProblemStatements(data || []);
    } catch (error) {
      console.error('Failed to fetch problem statements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const { error } = await supabase
        .from('problem_statements')
        .insert({
          title: newTitle,
          description: newDescription,
          visible: newVisible,
          file_path: null, // Will be set when file is uploaded
          scheduled_reveal: newScheduledReveal?.toISOString() || null,
        });

      if (error) throw error;
      await fetchProblemStatements();
      // Reset form
      setNewTitle('');
      setNewDescription('');
      setNewVisible(true);
      setNewScheduledReveal(null);
    } catch (error: any) {
      console.error('Failed to create problem statement:', error);
    }
  };

  const handleToggleVisibility = async (id: string) => {
    try {
      const { error } = await supabase
        .from('problem_statements')
        .update({ visible: !problemStatements.find((ps) => ps.id === id)?.visible })
        .eq('id', id);

      if (error) throw error;
      await fetchProblemStatements();
    } catch (error: any) {
      console.error('Failed to toggle visibility:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('problem_statements').delete().eq('id', id);
      if (error) throw error;
      await fetchProblemStatements();
    } catch (error: any) {
      console.error('Failed to delete problem statement:', error);
    }
  };

  return (
    <div className="p-6 sm:p-8">
      <h2 className="font-pixel text-[0.55rem] tracking-[0.15em] text-ball-400 uppercase mb-6">
        Problem Statements
      </h2>

      {/* Create form section */}
      <div className="rounded-card border border-white/10 bg-ink-800/80 p-6 mb-8">
        <h3 className="font-pixel text-[0.5rem] tracking-[0.15em] text-ball-400 uppercase mb-4">
          Create New Problem Statement
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
                placeholder="e.g. Dynamic TypeScript Exercises"
                className="mt-1 w-full rounded-xl border border-white/10 bg-ink-950/60 px-4 py-3 text-base text-shell-50 placeholder-text-shell-600 focus:border-ball-400 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="font-pixel text-[0.5rem] tracking-[0.15em] text-shell-400 uppercase mb-1">
                Description
              </label>
              <input
                type="text"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="e.g. Problems involving arrays, recursion, etc."
                className="mt-1 w-full rounded-xl border border-white/10 bg-ink-950/60 px-4 py-3 text-base text-shell-50 placeholder-text-shell-600 focus:border-ball-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="font-pixel text-[0.5rem] tracking-[0.15em] text-shell-400 uppercase mb-1">
                Visible
              </label>
              <select
                value={String(newVisible)}
                onChange={(e) => setNewVisible(e.target.value === 'true')}
                className="mt-1 w-full rounded-xl border border-white/10 bg-ink-950/60 px-4 py-3 text-base text-shell-50 placeholder-text-shell-600 focus:border-ball-400 focus:outline-none"
              >
                <option value="true">Visible (trainers can see)</option>
                <option value="false">Private (hidden from trainers)</option>
              </select>
            </div>

            <div>
              <label className="font-pixel text-[0.5rem] tracking-[0.15em] text-shell-400 uppercase mb-1">
                Scheduled Reveal
              </label>
              <input
                type="datetime-local"
                value={newScheduledReveal ? newDate.toISOString().slice(0, -5) : ''}
                onChange={(e) => setNewScheduledReveal(e.target.value ? new Date(e.target.value) : null)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-ink-950/60 px-4 py-3 text-base text-shell-50 placeholder-text-shell-600 focus:border-ball-400 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="mt-4 rounded-full border-2 border-ball-500 bg-ball-500 px-6 py-3 font-pixel text-xs tracking-wider text-shell-50 uppercase transition-colors hover:bg-ball-400 active:bg-ball-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Create Problem Statement
          </button>
          <button
            type="button"
            onClick={() => setNewTitle(''), setNewDescription(''), setNewVisible(true)}
            className="mt-2 rounded-full border-2 border-ball-400 bg-ball-800/50 px-4 py-2 font-pixel text-xs uppercase text-ball-300 hover:bg-ball-400 transition-colors"
          >
            Cancel
          </button>
        </form>
      </div>

      {/* Existing problem statements list */}
      {problemStatements.length === 0 && !loading && (
        <p className="text-shell-200/75">
          <EditMe>Phase 3: no problem statements found.</EditMe>
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
                Visible
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
            {problemStatements.map((ps) => (
              <tr key={ps.id} className="border-b border-white/10 hover:bg-ink-950/50">
                <td className="font-pixel text-sm text-shell-500">{ps.title}</td>
                <td className="font-pixel text-sm">
                  {ps.visible ? (
                    <span className="text-ball-400">Visible</span>
                  ) : (
                    <span className="text-ball-500">Private</span>
                  )}
                </td>
                <td className="font-pixel text-sm text-shell-400">
                  {new Date(ps.created_at).toLocaleDateString()}
                </td>
                <td className="font-pixel text-sm">
                  <EditMe>Phase 3: toggle visibility / delete</EditMe>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>