import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { EditMe } from '../components/ui/EditMe';

/**
 * Admin Event Settings.
 *
 * Allows admins/editors to modify:
 * - event_name
 * - tagline
 * - countdown_target (when event finishes)
 * - registration_deadline
 * - registration_open flag
 * - venue (NULL = [EDIT ME])
 * - team_size_min / max (NULL = [EDIT ME])
 *
 * Changes reflect instantly on the public landing page via Realtime subscriptions.
 */
export default function AdminSettings() {
  const [eventConfig, setEventConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{ tone: 'error' | 'success'; message: string } | null>(null);

  useEffect(() => {
    fetchEventConfig();
  }, []);

  const fetchEventConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('event_config')
        .select('*')
        .eq('id', 1)
        .single();

      if (error) throw error;
      setEventConfig(data);
    } catch (error) {
      console.error('Failed to fetch event config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    setEventConfig((prev: any) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? null : Number(value)) : value,
    }));
  };

  const saveEventConfig = async () => {
    try {
      setFormErrors({});
      setSaved(false);

      const { error } = await supabase
        .from('event_config')
        .update(eventConfig)
        .eq('id', 1);

      if (error) {
        setFormErrors({ general: error.message });
        throw error;
      }

      await fetchEventConfig();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error: any) {
      setFormErrors({
        general: error.message || 'Failed to save event config. Please try again.',
      });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);

    if (newPassword.length < 8) {
      setPasswordFeedback({
        tone: 'error',
        message: 'Password must be at least 8 characters long.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordFeedback({
        tone: 'error',
        message: 'Passwords do not match. Please verify both fields.',
      });
      return;
    }

    setPasswordBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setPasswordFeedback({
          tone: 'error',
          message: error.message || 'Failed to update password. Please try again.',
        });
        return;
      }

      setPasswordFeedback({
        tone: 'success',
        message: 'Password successfully updated! Your new password is now active.',
      });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordFeedback({
        tone: 'error',
        message: err instanceof Error ? err.message : 'An unexpected error occurred.',
      });
    } finally {
      setPasswordBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 sm:p-8">
        <p className="font-pixel text-[0.5rem] animate-spin">Loading event configuration...</p>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 space-y-8">
      <div>
        <h2 className="font-pixel text-[0.55rem] tracking-[0.15em] text-ball-400 uppercase mb-6">
          Event Settings
        </h2>

        {Object.keys(formErrors).length > 0 && (
          <div className="rounded-card border ball-400/30 bg-ball-500/10 p-4 mb-6">
            <p className="font-pixel text-ball-400 text-sm mb-1">Error:</p>
            <p className="font-pixel text-sm text-ball-400">{formErrors.general}</p>
          </div>
        )}

        {/* Event Configuration Form */}
        <div className="rounded-card border border-white/10 bg-ink-800/80 p-8">
          <form onSubmit={(e) => { e.preventDefault(); saveEventConfig(); }}>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="font-pixel text-[0.5rem] tracking-[0.15em] text-shell-400 uppercase mb-1">
                  Event Name
                </label>
                <input
                  type="text"
                  name="event_name"
                  value={eventConfig?.event_name || ''}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-ink-950/60 px-4 py-3 text-base text-shell-50 placeholder-text-shell-600 focus:border-ball-400 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="font-pixel text-[0.5rem] tracking-[0.15em] text-shell-400 uppercase mb-1">
                  Tagline
                </label>
                <input
                  type="text"
                  name="tagline"
                  value={eventConfig?.tagline || ''}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-ink-950/60 px-4 py-3 text-base text-shell-50 placeholder-text-shell-600 focus:border-ball-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="font-pixel text-[0.5rem] tracking-[0.15em] text-shell-400 uppercase mb-1">
                  Registration Deadline
                </label>
                <input
                  type="datetime-local"
                  name="registration_deadline"
                  value={eventConfig?.registration_deadline ? new Date(eventConfig.registration_deadline).toISOString().slice(0, -5) : ''}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-ink-950/60 px-4 py-3 text-base text-shell-50 placeholder-text-shell-600 focus:border-ball-400 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="font-pixel text-[0.5rem] tracking-[0.15em] text-shell-400 uppercase mb-1">
                  Countdown Target
                </label>
                <input
                  type="datetime-local"
                  name="countdown_target"
                  value={eventConfig?.countdown_target ? new Date(eventConfig.countdown_target).toISOString().slice(0, -5) : ''}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-ink-950/60 px-4 py-3 text-base text-shell-50 placeholder-text-shell-600 focus:border-ball-400 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="font-pixel text-[0.5rem] tracking-[0.15em] text-shell-400 uppercase mb-1">
                  Registration Open
                </label>
                <select
                  name="registration_open"
                  value={eventConfig?.registration_open ? String(eventConfig.registration_open) : 'false'}
                  onChange={(e) =>
                    setEventConfig((prev: any) => ({
                      ...prev,
                      registration_open: e.target.value === 'true',
                    }))
                  }
                  className="mt-1 w-full rounded-xl border border-white/10 bg-ink-950/60 px-4 py-3 text-base text-shell-50 placeholder-text-shell-600 focus:border-ball-400 focus:outline-none"
                >
                  <option value="true">true</option>
                  <option value="false">false</option>
                </select>
              </div>

              <div>
                <label className="font-pixel text-[0.5rem] tracking-[0.15em] text-shell-400 uppercase mb-1">
                  Venue
                </label>
                <input
                  type="text"
                  name="venue"
                  value={eventConfig?.venue || ''}
                  onChange={handleInputChange}
                  placeholder="Leave blank for [EDIT ME]"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-ink-950/60 px-4 py-3 text-base text-shell-50 placeholder-text-shell-600 focus:border-ball-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-pixel text-[0.5rem] tracking-[0.15em] text-shell-400 uppercase mb-1">
                  Min Team Size
                </label>
                <input
                  type="number"
                  name="team_size_min"
                  value={eventConfig?.team_size_min ?? ''}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-ink-950/60 px-4 py-3 text-base text-shell-50 placeholder-text-shell-600 focus:border-ball-400 focus:outline-none"
                  min="1"
                />
              </div>

              <div>
                <label className="font-pixel text-[0.5rem] tracking-[0.15em] text-shell-400 uppercase mb-1">
                  Max Team Size
                </label>
                <input
                  type="number"
                  name="team_size_max"
                  value={eventConfig?.team_size_max ?? ''}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-ink-950/60 px-4 py-3 text-base text-shell-50 placeholder-text-shell-600 focus:border-ball-400 focus:outline-none"
                  min="1"
                />
              </div>
            </div>

            <div className="mt-8 flex items-center gap-4">
              <button
                type="submit"
                disabled={loading}
                className="rounded-full border-2 border-ball-500 bg-ball-500 px-6 py-3 font-pixel text-xs tracking-wider text-shell-50 uppercase transition-colors hover:bg-ball-400 active:bg-ball-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={fetchEventConfig}
                className="rounded-full border-2 border-ball-400 bg-ball-800/50 px-4 py-2 font-pixel text-xs uppercase text-ball-300 hover:bg-ball-400 transition-colors"
              >
                Reset
              </button>
              {saved && (
                <span className="font-pixel text-xs text-emerald-400">Settings saved successfully!</span>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Admin Account Security & Password Management */}
      <div>
        <h2 className="font-pixel text-[0.55rem] tracking-[0.15em] text-ball-400 uppercase mb-6">
          Admin Security & Password
        </h2>

        <div className="rounded-card border border-white/10 bg-ink-800/80 p-8 max-w-xl">
          <p className="text-sm text-shell-200/75 mb-6">
            Default password for administrators and managers is initialized to{' '}
            <code className="rounded bg-ink-950 px-2 py-0.5 font-mono text-ball-400">password@67</code>.
            You can update your personal account password at any time below.
          </p>

          {passwordFeedback && (
            <div
              className={`rounded-card border p-4 mb-6 ${
                passwordFeedback.tone === 'error'
                  ? 'border-ball-400/50 bg-ball-500/10 text-ball-50'
                  : 'border-mint-400/40 bg-mint-500/10 text-mint-400'
              }`}
            >
              <p className="text-sm leading-relaxed">{passwordFeedback.message}</p>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label
                htmlFor="new-admin-password"
                className="font-pixel text-[0.5rem] tracking-[0.15em] text-shell-400 uppercase"
              >
                New Password
              </label>
              <div className="relative mt-2">
                <input
                  id="new-admin-password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  minLength={8}
                  required
                  className="w-full rounded-xl border border-white/10 bg-ink-950/60 px-4 py-3 pr-12 text-base text-shell-50 transition-colors placeholder:text-shell-600 focus:border-ball-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-shell-400 hover:text-shell-100 transition-colors focus:outline-none"
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  title={showNewPassword ? 'Hide password' : 'Show password'}
                >
                  {showNewPassword ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirm-admin-password"
                className="font-pixel text-[0.5rem] tracking-[0.15em] text-shell-400 uppercase"
              >
                Confirm New Password
              </label>
              <div className="relative mt-2">
                <input
                  id="confirm-admin-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  minLength={8}
                  required
                  className="w-full rounded-xl border border-white/10 bg-ink-950/60 px-4 py-3 pr-12 text-base text-shell-50 transition-colors placeholder:text-shell-600 focus:border-ball-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-shell-400 hover:text-shell-100 transition-colors focus:outline-none"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={passwordBusy}
              className="mt-2 rounded-full border-2 border-ball-500 bg-ball-500 px-6 py-3 font-pixel text-xs tracking-wider text-shell-50 uppercase transition-colors hover:bg-ball-400 active:bg-ball-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {passwordBusy ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>

      {/* Info note */}
      <div className="p-6 rounded-card border ball-400/30 bg-ball-500/10">
        <p className="font-pixel text-[0.5rem] text-ball-400 uppercase mb-2">
          Changes reflect instantly
        </p>
        <p className="font-pixel text-shell-200/75">
          <EditMe>Phase 3: realtime subscription updates the public landing page automatically.</EditMe>
        </p>
      </div>
    </div>
  );
}