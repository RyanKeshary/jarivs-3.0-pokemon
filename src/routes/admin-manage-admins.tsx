import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { EditMe } from '../components/ui/EditMe';

/**
 * Manager-Only: Manage Admins.
 *
 * Features:
 * - List all users with admin role
 * - Add admin by email (insert into allowed_emails with role 'admin')
 * - Remove admin (update role back to 'trainer')
 * - Protection: managers cannot be demoted by anyone, including each other
 * - Every action written to audit_log
 */
export default function AdminManageAdmins() {
  const [admins, setAdmins] = useState<
    {
      email: string;
      grants_role: string | null;
      created_at: string;
    }[]>([]);

  const [targetEmail, setTargetEmail] = useState('');
  const [targetAction, setTargetAction] = useState<'add' | 'remove'>('add');
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      // Fetch users who have admin role in allowed_emails
      const { data, error } = await supabase
        .from('allowed_emails')
        .select('email, grants_role, created_at')
        .eq('grants_role', 'admin');

      if (error) throw error;
      setAdmins(data || []);
    } catch (error) {
      console.error('Failed to fetch admins:', error);
    }
  };

  const handleAction = async () => {
    if (!targetEmail.trim()) return;
    setError(null);
    setSuccess(null);

    const email = targetEmail.trim().toLowerCase();

    try {
      if (targetAction === 'add') {
        const { error } = await supabase.from('allowed_emails').upsert({
          email,
          grants_role: 'admin',
          note: 'Added by manager via admin panel',
        });

        if (error) throw error;

        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id, role')
          .eq('email', email)
          .maybeSingle();

        if (existingProfile) {
          await supabase
            .from('profiles')
            .update({ role: 'admin' })
            .eq('email', email);
        }

        await supabase.rpc('insert_audit_log', {
          p_action: 'grant_admin',
          p_target_id: existingProfile?.id,
          p_target_type: 'profile',
          p_details: { email }
        });

        setSuccess(`Admin role granted to ${email}`);
        await fetchAdmins();
        setTargetEmail('');
      } else if (targetAction === 'remove') {
        const isProtected = [
          'ryankeshary@gmail.com',
          'shrey.sleeps@gmail.com',
        ].includes(email);

        if (isProtected) {
          setError('Cannot demote a protected manager. Only another manager may change their role, and even then they cannot be demoted.');
          return;
        }

        const { error } = await supabase
          .from('allowed_emails')
          .update({ grants_role: 'trainer' })
          .eq('email', email);

        if (error) throw error;

        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id, role')
          .eq('email', email)
          .maybeSingle();

        if (existingProfile) {
          await supabase
            .from('profiles')
            .update({ role: 'trainer' })
            .eq('email', email);
        }

        await supabase.rpc('insert_audit_log', {
          p_action: 'revoke_admin',
          p_target_id: existingProfile?.id,
          p_target_type: 'profile',
          p_details: { email }
        });

        setSuccess(`${email} demoted to trainer role`);
        await fetchAdmins();
        setTargetEmail('');
      }
    } catch (error: any) {
      setError(error.message || 'Action failed. Please try again.');
    }
  };

  return (
    <div className="p-6 sm:p-8">
      <h2 className="font-pixel text-[0.55rem] tracking-[0.15em] text-ball-400 uppercase mb-6">
        Manage Admins
      </h2>

      {/* Admins list */}
      <div className="rounded-card border border-white/10 bg-ink-800/80 p-6 mb-8">
        <h3 className="font-pixel text-[0.5rem] tracking-[0.15em] text-ball-400 uppercase mb-4">
          Current Admins
        </h3>

        {admins.length === 0 && (
          <p className="text-shell-200/75">
            <EditMe>Phase 3: no admins found.</EditMe>
          </p>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="font-pixel text-[0.5rem] text-shell-400 uppercase text-left">
                  Email
                </th>
                <th className="font-pixel text-[0.5rem] text-shell-400 uppercase text-left">
                    Role
                  </th>
                  <th className="font-pixel text-[0.5rem] text-shell-400 uppercase text-left">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {admins.map((a) => (
                  <tr key={a.email} className="border-b border-white/10 hover:bg-ink-950/50">
                    <td className="font-pixel text-sm text-shell-500">{a.email}</td>
                    <td className="font-pixel text-sm">
                      {a.grants_role}
                    </td>
                    <td className="font-pixel text-sm">
                      <button
                        type="button"
                        onClick={() => {
                          setTargetEmail(a.email);
                          setTargetAction('remove');
                        }}
                        className="text-xs text-rose-400 hover:text-rose-300 underline"
                      >
                        Select to Demote
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-xs text-shell-400">
            <EditMe>Phase 3: ryankeshary@gmail.com and shrey.sleeps@gmail.com are protected managers and cannot be demoted.</EditMe>
          </p>
        </div>

        {/* Add/Remove admin form */}
        <div className="mt-8 p-6 rounded-card border ball-400/30 bg-ball-500/10">
          <h3 className="font-pixel text-[0.5rem] tracking-[0.15em] text-ball-400 uppercase mb-4">
            Add or Remove Admin
          </h3>

          {success && (
            <p className="font-pixel text-ball-400 text-sm mb-2">{success}</p>
          )}

          {error && (
            <p className="font-pixel text-rose-400 text-sm mb-2">{error}</p>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAction();
            }}
          >
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="font-pixel text-[0.5rem] tracking-[0.15em] text-shell-400 uppercase mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={targetEmail}
                  onChange={(e) => setTargetEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-ink-950/60 px-4 py-3 text-base text-shell-50 placeholder-text-shell-600 focus:border-ball-400 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="font-pixel text-[0.5rem] tracking-[0.15em] text-shell-400 uppercase mb-1">
                  Action
                </label>
                <select
                  value={targetAction}
                  onChange={(e) => setTargetAction(e.target.value as any)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-ink-950/60 px-4 py-3 text-base text-shell-50 placeholder-text-shell-600 focus:border-ball-400 focus:outline-none"
                >
                  <option value="add">Grant admin role</option>
                  <option value="remove">Revoke admin role (set to trainer)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="rounded-full border-2 border-ball-500 bg-ball-500 px-6 py-3 font-pixel text-xs tracking-wider text-shell-50 uppercase transition-colors hover:bg-ball-400 active:bg-ball-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {targetAction === 'add' ? 'Grant Admin Role' : 'Revoke Admin Role'}
            </button>
          </form>
        </div>
      </div>
    );
  }