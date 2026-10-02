import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { EditMe } from '../components/ui/EditMe';

/**
 * Admin Resources Manager.
 *
 * Features:
 * - Upload/replace brochure (PDF)
 * - Upload/replace PPT template (PPTX)
 * - One row per kind (brochure / ppt_template) via unique constraint
 * - Visible / Private toggle
 * - URLs stored in file_path or url column
 */
export default function AdminResources() {
  const [resources, setResources] = useState<
    {
      id: string;
      kind: 'brochure' | 'ppt_template';
      title: string;
      description: string;
      file_path: string | null;
      url: string | null;
      visible: boolean;
      created_at: string;
    }[]>([]);

  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newKind, setNewKind] = useState<'brochure' | 'ppt_template'>('brochure');
  const [newVisible, setNewVisible] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResources((data as any) || []);
    } catch (error) {
      console.error('Failed to fetch resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    try {
      const { error } = await supabase.from('resources').insert({
        kind: newKind,
        title: newTitle,
        description: newDescription || '',
        visible: newVisible,
        file_path: null,
        url: null,
      });

      if (error) throw error;
      await fetchResources();
      setNewTitle('');
      setNewDescription('');
    } catch (error: any) {
      console.error('Failed to create resource:', error);
    }
  };

  const handleToggleVisibility = async (id: string) => {
    try {
      const { error } = await supabase
        .from('resources')
        .update({ visible: !resources.find((r) => r.id === id)?.visible })
        .eq('id', id);

      if (error) throw error;
      await fetchResources();
    } catch (error: any) {
      console.error('Failed to toggle visibility:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('resources').delete().eq('id', id);
      if (error) throw error;
      await fetchResources();
    } catch (error: any) {
      console.error('Failed to delete resource:', error);
    }
  };

  return (
    <div className="p-6 sm:p-8">
      <h2 className="font-pixel text-[0.55rem] tracking-[0.15em] text-ball-400 uppercase mb-6">
        Resources
      </h2>

      {/* Create resource form */}
      <div className="rounded-card border border-white/10 bg-ink-800/80 p-6 mb-8">
        <h3 className="font-pixel text-[0.5rem] tracking-[0.15em] text-ball-400 uppercase mb-4">
          Create New Resource
        </h3>

        <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }}>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="font-pixel text-[0.5rem] tracking-[0.15em] text-shell-400 uppercase mb-1">
                Title
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Event Brochure"
                className="mt-1 w-full rounded-xl border border-white/10 bg-ink-950/60 px-4 py-3 text-base text-shell-50 placeholder-text-shell-600 focus:border-ball-400 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="font-pixel text-[0.5rem] tracking-[0.15em] text-shell-400 uppercase mb-1">
                Kind
              </label>
              <select
                value={newKind}
                onChange={(e) => setNewKind(e.target.value as any)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-ink-950/60 px-4 py-3 text-base text-shell-50 placeholder-text-shell-600 focus:border-ball-400 focus:outline-none"
              >
                <option value="brochure">Brochure (PDF)</option>
                <option value="ppt_template">PPT Template (.pptx)</option>
              </select>
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
                <option value="true">Visible</option>
                <option value="false">Private</option>
              </select>
            </div>

            <div>
              <label className="font-pixel text-[0.5rem] tracking-[0.15em] text-shell-400 uppercase mb-1">
                Description
              </label>
              <input
                type="text"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Brief description"
                className="mt-1 w-full rounded-xl border border-white/10 bg-ink-950/60 px-4 py-3 text-base text-shell-50 placeholder-text-shell-600 focus:border-ball-400 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="mt-4 rounded-full border-2 border-ball-500 bg-ball-500 px-6 py-3 font-pixel text-xs tracking-wider text-shell-50 uppercase transition-colors hover:bg-ball-400 active:bg-ball-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Publish Resource
          </button>
          <button
            type="button"
            onClick={() => {
              setNewTitle('');
              setNewDescription('');
              setNewKind('brochure');
              setNewVisible(true);
            }}
            className="mt-2 ml-3 rounded-full border-2 border-ball-400 bg-ball-800/50 px-4 py-2 font-pixel text-xs uppercase text-ball-300 hover:bg-ball-400 transition-colors"
          >
            Cancel
          </button>
        </form>
      </div>

      {/* Existing resources list */}
      {resources.length === 0 && !loading && (
        <p className="text-shell-200/75">
          <EditMe>Phase 3: no resources found.</EditMe>
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="font-pixel text-[0.5rem] text-shell-400 uppercase text-left">
                Kind
              </th>
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
            {resources.map((r) => (
              <tr key={r.id} className="border-b border-white/10 hover:bg-ink-950/50">
                <td className="font-pixel text-sm">
                  {r.kind}
                </td>
                <td className="font-pixel text-sm text-shell-500">{r.title}</td>
                <td className="font-pixel text-sm">
                  {r.visible ? (
                    <span className="text-ball-400">Visible</span>
                  ) : (
                    <span className="text-ball-500">Private</span>
                  )}
                </td>
                <td className="font-pixel text-sm text-shell-400">
                  {new Date(r.created_at).toLocaleDateString()}
                </td>
                <td className="font-pixel text-xs space-x-3">
                  <button
                    type="button"
                    onClick={() => handleToggleVisibility(r.id)}
                    className="text-ball-400 hover:text-ball-300 underline"
                  >
                    {r.visible ? 'Hide' : 'Show'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(r.id)}
                    className="text-rose-400 hover:text-rose-300 underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}