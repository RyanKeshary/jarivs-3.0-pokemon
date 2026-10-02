import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';

/**
 * Master Login for Admin/Manager.
 *
 * This is the "gateway" that all /admin/* routes pass through.
 * Only trainers with role 'admin' or 'manager' may proceed.
 * A trainer who navigates to /admin must be refused (redirect to /).
 *
 * Features:
 * - Email + password sign in
 * - On success, stores role in sessionStorage so /admin routes can check
 * - On failure, shows humanised error
 * - Rate-limited attempts via database guard (already in Phase 2 trigger)
 */
export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: 'error' | 'success' | 'info'; message: string } | null>(null);

  useEffect(() => {
    // Check if already logged in via stored role
    const storedRole = sessionStorage.getItem('admin_role');
    if (storedRole && (storedRole === 'admin' || storedRole === 'manager')) {
      const targetPath = location.pathname === '/admin/login' ? '/admin' : location.pathname;
      navigate(targetPath, { replace: true });
    }
  }, [navigate, location.pathname]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setFeedback(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        setFeedback({
          tone: 'error',
          message: humaniseAuthError(error.message),
        });
        return;
      }

      // Fetch the user's profile to determine role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('email', email.trim().toLowerCase())
        .single();

      if (profileError || !profile) {
        setFeedback({
          tone: 'error',
          message: 'Account found but profile not found. Contact an organizer.',
        });
        return;
      }

      // Store role in sessionStorage so /admin routes can check it
      sessionStorage.setItem('admin_role', profile.role);

      // Redirect to admin dashboard
      navigate('/admin', { replace: true });
    } catch (error) {
      setFeedback({
        tone: 'error',
        message: error instanceof Error ? `Something went wrong: ${error.message}` : 'Something went wrong.',
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-ink-900 px-5 sm:px-8 py-8">
      <h1 className="text-2xl font-bold text-shell-50 sm:text-3xl uppercase tracking-wider mb-6">
        Master Login
      </h1>

      {feedback ? (
        <p
          role="status"
          aria-live="polite"
          className={`rounded-lg border px-4 py-3 text-sm leading-relaxed ${
            feedback.tone === 'error'
              ? 'border-ball-400/50 bg-ball-500/10 text-ball-50'
              : feedback.tone === 'success'
                ? 'border-mint-400/40 bg-mint-500/10 text-mint-400'
                : 'border-white/15 bg-white/5 text-shell-200'
          }`}
        >
          {feedback.message}
        </p>
      ) : null}

      <div className="rounded-card border border-white/10 bg-ink-800/80 p-8 sm:p-10 max-w-md">
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div>
            <label htmlFor="admin-email" className="font-pixel text-[0.52rem] tracking-[0.2em] text-shell-400 uppercase">
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              inputMode="email"
              className="mt-2 w-full rounded-xl border border-white/10 bg-ink-950/60 px-4 py-3 text-base text-shell-50 transition-colors placeholder:text-shell-600 focus:border-ball-400 focus:outline-none"
              placeholder="admin@slrtce.in"
              required
            />
          </div>

          <div>
            <label htmlFor="admin-password" className="font-pixel text-[0.52rem] tracking-[0.2em] text-shell-400 uppercase">
              Password
            </label>
            <div className="relative mt-2">
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full rounded-xl border border-white/10 bg-ink-950/60 px-4 py-3 pr-12 text-base text-shell-50 transition-colors placeholder:text-shell-600 focus:border-ball-400 focus:outline-none"
                placeholder="••••••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-shell-400 hover:text-shell-100 transition-colors focus:outline-none focus:ring-1 focus:ring-ball-400"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
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
            disabled={busy}
            className="mt-4 rounded-full border-2 border-ball-500 bg-ball-500 px-6 py-3 font-pixel text-xs tracking-wider text-shell-50 uppercase transition-colors hover:bg-ball-400 active:bg-ball-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-xs leading-relaxed text-shell-600">
          Only organizers with @slrtce.in addresses or allowlisted emails may access the admin panel.
        </p>
      </div>
    </div>
  );
}

/**
 * Humanise GoTrue auth errors for the admin login form.
 */
function humaniseAuthError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes('invalid login credentials')) {
    return 'That email and password did not match. Check both and try again.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Confirm your email address first, then sign in.';
  }
  if (lower.includes('user already registered')) {
    return 'An account already exists for that address.';
  }
  if (lower.includes('password should be')) {
    return 'Choose a password of at least 8 characters.';
  }
  if (lower.includes('rate limit') || lower.includes('too many')) {
    return 'Too many attempts. Wait a minute and try again.';
  }
  if (lower.includes('restricted to approved')) {
    return 'Registration is restricted to approved addresses. Ask an admin.';
  }
  return message;
}