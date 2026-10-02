import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

/**
 * Master Login for Admin/Manager.
 *
 * Rules:
 * - Admin logins MUST use @slrtce.in email address.
 * - Managers are accepted from ANY domain (e.g. gmail, etc.).
 * - If non-@slrtce.in is entered, a warning is displayed.
 * - Fits within viewport with no scrolling.
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

  const emailTrimmed = email.trim().toLowerCase();
  const emailDomain = emailTrimmed.includes('@') ? emailTrimmed.split('@')[1] : '';
  const isNonSlrtceDomain = emailDomain.length > 0 && emailDomain !== 'slrtce.in';

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setFeedback(null);

    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: emailTrimmed,
        password,
      });

      if (error) {
        setFeedback({
          tone: 'error',
          message: humaniseAuthError(error.message),
        });
        return;
      }

      // Fetch the user's profile to verify role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .single();

      if (profileError || !profile) {
        setFeedback({
          tone: 'error',
          message: 'Account authenticated but profile was not found. Please contact an organizer.',
        });
        return;
      }

      // Check role permissions:
      // 1. Managers are accepted from ANY domain
      if (profile.role === 'manager') {
        sessionStorage.setItem('admin_role', 'manager');
        navigate('/admin', { replace: true });
        return;
      }

      // 2. Admins MUST be from @slrtce.in
      if (profile.role === 'admin') {
        if (!emailTrimmed.endsWith('@slrtce.in')) {
          await supabase.auth.signOut();
          setFeedback({
            tone: 'error',
            message:
              'Access denied: Admin accounts must use an official @slrtce.in address. (Only Managers may log in from an external domain).',
          });
          return;
        }

        sessionStorage.setItem('admin_role', 'admin');
        navigate('/admin', { replace: true });
        return;
      }

      // 3. Any other role (trainer) is rejected
      await supabase.auth.signOut();
      setFeedback({
        tone: 'error',
        message: 'Access restricted: Trainer accounts do not have access to the Admin Command Center.',
      });
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
    <div className="relative flex h-screen max-h-screen overflow-hidden flex-col items-center justify-center bg-ink-900 px-5 sm:px-8 py-4 select-none">
      <div aria-hidden="true" className="bg-hero-wash absolute inset-0 -z-10 opacity-70" />
      <div aria-hidden="true" className="bg-dot-grid absolute inset-0 -z-10 opacity-40" />

      {/* Back button */}
      <div className="absolute top-4 left-5 sm:left-8">
        <Link
          to="/"
          className="font-pixel text-[0.52rem] uppercase tracking-wider text-shell-400 hover:text-ball-400 transition-colors"
        >
          ← Back to League
        </Link>
      </div>

      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-white/10 bg-ink-800/85 p-6 sm:p-8 backdrop-blur-md shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-wider text-shell-50 font-display">
                Master Login
              </h1>
              <p className="mt-1 text-xs text-shell-400">
                Staff & Organizer Command Gateway
              </p>
            </div>
            <span className="rounded-lg bg-ball-500/10 p-2 text-ball-400 border border-ball-500/20">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </span>
          </div>

          {feedback && (
            <p
              role="status"
              aria-live="polite"
              className={`rounded-lg border px-3.5 py-2.5 text-xs leading-normal mb-4 ${
                feedback.tone === 'error'
                  ? 'border-ball-400/50 bg-ball-500/15 text-ball-100'
                  : feedback.tone === 'success'
                    ? 'border-mint-400/40 bg-mint-500/15 text-mint-300'
                    : 'border-white/15 bg-white/5 text-shell-200'
              }`}
            >
              {feedback.message}
            </p>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label htmlFor="admin-email" className="font-pixel text-[0.48rem] tracking-[0.2em] text-shell-400 uppercase">
                Email Address
              </label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                inputMode="email"
                className="mt-1 w-full rounded-xl border border-white/10 bg-ink-950/60 px-3.5 py-2 text-sm text-shell-50 transition-colors placeholder:text-shell-600 focus:border-ball-400 focus:outline-none"
                placeholder="staff@slrtce.in or manager email"
                required
              />
              {/* Domain Warning */}
              {isNonSlrtceDomain && (
                <div className="mt-1.5 flex items-start gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-[0.7rem] leading-tight text-amber-300">
                  <svg className="h-3.5 w-3.5 shrink-0 text-amber-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>
                    <strong>Notice:</strong> Admin logins require an <code className="text-amber-200">@slrtce.in</code> address. Managers are accepted from any approved domain.
                  </span>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="admin-password" className="font-pixel text-[0.48rem] tracking-[0.2em] text-shell-400 uppercase">
                Password
              </label>
              <div className="relative mt-1">
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-white/10 bg-ink-950/60 px-3.5 py-2 pr-10 text-sm text-shell-50 transition-colors placeholder:text-shell-600 focus:border-ball-400 focus:outline-none"
                  placeholder="••••••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-shell-400 hover:text-shell-100 transition-colors focus:outline-none focus:ring-1 focus:ring-ball-400"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
              className="mt-2 rounded-full border border-ball-400 bg-ball-500 py-2.5 font-pixel text-xs tracking-wider text-shell-50 uppercase transition-all hover:bg-ball-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? 'Authenticating...' : 'Sign In to Command Center'}
            </button>
          </form>

          <p className="mt-4 text-[0.68rem] text-center text-shell-500 leading-tight">
            Default credentials initialized to <code className="text-ball-400 font-mono">password@67</code>.
          </p>
        </div>
      </div>
    </div>
  );
}

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