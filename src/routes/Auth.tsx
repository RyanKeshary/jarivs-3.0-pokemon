import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { Art } from '../components/ui/Art';
import { pokedexClose, pokedexOpen } from '../lib/assets';
import { supabase } from '../lib/supabase';

type Mode = 'register' | 'login';

interface AuthFeedback {
  tone: 'error' | 'success' | 'info';
  message: string;
}

export default function Auth() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [mode, setMode] = useState<Mode>(() =>
    params.get('mode') === 'login' ? 'login' : 'register',
  );
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<AuthFeedback | null>(null);

  // Switching modes should not leave the previous error on screen.
  useEffect(() => setFeedback(null), [mode]);

  const emailTrimmed = email.trim().toLowerCase();
  const emailDomain = emailTrimmed.includes('@') ? emailTrimmed.split('@')[1] : '';
  const isNonSlrtceDomain = emailDomain.length > 0 && emailDomain !== 'slrtce.in';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    setFeedback(null);
    setBusy(true);

    try {
      if (mode === 'register') {
        // Pre-check if email is allowed (allowed if @slrtce.in OR an authorized manager in allowlist)
        const { data: allowed, error: checkError } = await supabase.rpc(
          'is_registration_email_allowed',
          { p_email: emailTrimmed },
        );

        if (checkError) {
          setFeedback({
            tone: 'error',
            message:
              'Could not verify email registration right now. Please try again in a moment.',
          });
          return;
        }

        if (!allowed) {
          setFeedback({
            tone: 'error',
            message:
              'Registration is restricted to @slrtce.in email addresses. Only approved managers may register using an external address.',
          });
          return;
        }

        const { error } = await supabase.auth.signUp({
          email: emailTrimmed,
          password,
          options: { data: { full_name: fullName.trim() } },
        });

        if (error) {
          setFeedback({ tone: 'error', message: humaniseAuthError(error.message) });
          return;
        }

        setFeedback({
          tone: 'success',
          message:
            'Account created! If sign-in does not occur automatically, verify your email and sign in.',
        });
      } else {
        const { data: authData, error } = await supabase.auth.signInWithPassword({
          email: emailTrimmed,
          password,
        });

        if (error) {
          setFeedback({ tone: 'error', message: humaniseAuthError(error.message) });
          return;
        }

        // Verify role access for non-slrtce accounts
        if (authData.user && isNonSlrtceDomain) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', authData.user.id)
            .maybeSingle();

          const role = profile?.role;
          if (role !== 'manager' && role !== 'admin') {
            await supabase.auth.signOut();
            setFeedback({
              tone: 'error',
              message:
                'Access restricted: Non-@slrtce.in accounts are only permitted for Managers. Please log in with your @slrtce.in address.',
            });
            return;
          }
        }

        navigate('/center', { replace: true });
      }
    } catch (error) {
      setFeedback({
        tone: 'error',
        message:
          error instanceof Error
            ? `Something went wrong: ${error.message}`
            : 'Something went wrong. Please try again.',
      });
    } finally {
      setBusy(false);
    }
  }

  const isRegister = mode === 'register';

  return (
    <div className="relative flex h-screen max-h-screen overflow-hidden flex-col justify-between bg-ink-900 select-none">
      <div aria-hidden="true" className="bg-hero-wash absolute inset-0 -z-10 opacity-70" />
      <div aria-hidden="true" className="bg-dot-grid absolute inset-0 -z-10 opacity-40" />

      {/* Header */}
      <header className="px-5 py-3 sm:px-8 shrink-0">
        <Link
          to="/"
          className="group inline-flex items-center gap-2.5"
          aria-label="Back to Kanto League"
        >
          <span className="relative h-8 w-6 shrink-0">
            <Art
              asset={pokedexClose}
              alt=""
              className="absolute inset-0 h-full w-full object-contain transition-opacity duration-300 group-hover:opacity-0"
            />
            <Art
              asset={pokedexOpen}
              alt=""
              className="absolute inset-0 h-full w-full object-contain opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            />
          </span>
          <span className="font-pixel text-[0.52rem] tracking-[0.15em] text-shell-50">
            KANTO LEAGUE
          </span>
        </Link>
      </header>

      {/* Main Content: snugly centered, never scrolls */}
      <main className="flex flex-1 items-center justify-center px-4 py-1 shrink-0">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-white/10 bg-ink-800/85 p-5 sm:p-6 backdrop-blur-md shadow-2xl">
            <h1 className="text-xl sm:text-2xl font-bold text-shell-50 tracking-tight">
              {isRegister ? 'Claim your trainer profile' : 'Welcome back'}
            </h1>
            <p className="mt-1 text-xs leading-normal text-shell-200/75">
              {isRegister
                ? 'Register with @slrtce.in. Managers may use approved external emails.'
                : 'Sign in to access your trainer card and team roster.'}
            </p>

            {/* Mode switch */}
            <div
              role="tablist"
              aria-label="Sign in or register"
              className="mt-3.5 grid grid-cols-2 gap-1 rounded-full border border-white/10 bg-ink-950/60 p-1"
            >
              {(['register', 'login'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={mode === value}
                  onClick={() => setMode(value)}
                  className={`rounded-full py-1.5 font-pixel text-[0.52rem] tracking-[0.12em] uppercase transition-colors ${
                    mode === value
                      ? 'bg-ball-500 text-shell-50 shadow-sm'
                      : 'text-shell-400 hover:text-shell-100'
                  }`}
                >
                  {value === 'register' ? 'Register' : 'Login'}
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-3.5 flex flex-col gap-2.5" noValidate>
              {isRegister && (
                <Field
                  id="full-name"
                  label="Full name"
                  value={fullName}
                  onChange={setFullName}
                  autoComplete="name"
                  placeholder="Red Ketchum"
                  required
                />
              )}

              <div>
                <Field
                  id="email"
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  autoComplete="email"
                  inputMode="email"
                  placeholder="trainer@slrtce.in"
                  required
                />
                {/* Warning when domain is not @slrtce.in */}
                {isNonSlrtceDomain && (
                  <div className="mt-1.5 flex items-start gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-[0.7rem] leading-tight text-amber-300">
                    <svg className="h-3.5 w-3.5 shrink-0 text-amber-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>
                      <strong>Notice:</strong> Only <code className="text-amber-200">@slrtce.in</code> addresses are allowed. Managers may proceed with approved external emails.
                    </span>
                  </div>
                )}
              </div>

              <Field
                id="password"
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                placeholder="••••••••••••"
                minLength={8}
                required
              />

              {feedback && (
                <p
                  role="status"
                  aria-live="polite"
                  className={`rounded-lg border px-3 py-2 text-xs leading-normal ${
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

              <button
                type="submit"
                disabled={busy}
                className="mt-1 flex items-center justify-center gap-2 rounded-full border border-ball-400 bg-ball-500 py-2.5 font-pixel text-xs tracking-wider text-shell-50 uppercase transition-all hover:bg-ball-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? 'Working...' : isRegister ? 'Create account' : 'Sign in'}
              </button>
            </form>

            <p className="mt-2.5 text-[0.68rem] text-center text-shell-500 leading-tight">
              {isRegister
                ? 'Min 8 characters. Team formation and deck submissions unlock in Phase 2.'
                : 'Need help? Contact the Kanto League organizing team.'}
            </p>
          </div>
        </div>
      </main>

      {/* Bottom compact status bar */}
      <footer className="px-5 py-2.5 text-center text-[0.62rem] text-shell-600 border-t border-white/5 shrink-0">
        Kanto League OS • Secure Authentication Portal
      </footer>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = 'text',
  ...rest
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  [key: string]: unknown;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div>
      <label
        htmlFor={id}
        className="font-pixel text-[0.48rem] tracking-[0.18em] text-shell-400 uppercase"
      >
        {label}
      </label>
      <div className="relative mt-1">
        <input
          id={id}
          name={id}
          type={effectiveType}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`w-full rounded-xl border border-white/10 bg-ink-950/60 px-3.5 py-2 text-sm text-shell-50 transition-colors placeholder:text-shell-600 focus:border-ball-400 focus:outline-none ${
            isPassword ? 'pr-10' : ''
          }`}
          {...rest}
        />
        {isPassword && (
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
        )}
      </div>
    </div>
  );
}

function humaniseAuthError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes('invalid login credentials')) {
    return 'That email and password combination did not match. Check both and try again.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Confirm your email address first, then sign in.';
  }
  if (lower.includes('user already registered')) {
    return 'An account already exists for that address. Try signing in instead.';
  }
  if (lower.includes('password should be')) {
    return 'Choose a password of at least 8 characters.';
  }
  if (lower.includes('rate limit') || lower.includes('too many')) {
    return 'Too many attempts. Wait a minute and try again.';
  }
  if (lower.includes('restricted to approved')) {
    return 'Registration is restricted to @slrtce.in. Ask an admin to add you to the allowlist.';
  }
  return message;
}
