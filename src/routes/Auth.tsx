import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { Art } from '../components/ui/Art';
import { EditMe } from '../components/ui/EditMe';
import { pokedexClose, pokedexOpen } from '../lib/assets';
import { supabase } from '../lib/supabase';

type Mode = 'register' | 'login';

interface AuthFeedback {
  tone: 'error' | 'success' | 'info';
  message: string;
}

/**
 * Sign in / create account.
 *
 * The @slrtce.in rule is enforced by a trigger on auth.users (migration 0003),
 * not by anything on this page. The client-side check below exists purely to give
 * a clear message *before* the round trip - if someone bypassed it, the database
 * would still refuse the signup, so this is a convenience and not a control.
 */
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    setFeedback(null);
    setBusy(true);

    try {
      if (mode === 'register') {
        // Fail fast on a domain the database will reject anyway.
        const { data: allowed, error: checkError } = await supabase.rpc(
          'is_registration_email_allowed',
          { p_email: email.trim().toLowerCase() },
        );

        if (checkError) {
          setFeedback({
            tone: 'error',
            message:
              'Could not verify your email address right now. Please try again in a moment.',
          });
          return;
        }

        if (!allowed) {
          setFeedback({
            tone: 'error',
            message:
              'Registration is restricted to @slrtce.in. If you are an organiser from outside ' +
              'the college, ask an admin to add your address to the allowlist.',
          });
          return;
        }

        const { error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
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
            'Account created. If sign-in does not happen automatically, confirm your email ' +
            'address and then sign in.',
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

        if (error) {
          setFeedback({ tone: 'error', message: humaniseAuthError(error.message) });
          return;
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
    <div className="relative flex min-h-screen flex-col bg-ink-900">
      <div aria-hidden="true" className="bg-hero-wash absolute inset-0 -z-10 opacity-70" />
      <div aria-hidden="true" className="bg-dot-grid absolute inset-0 -z-10 opacity-40" />

      <header className="px-5 py-6 sm:px-8">
        <Link
          to="/"
          className="group inline-flex items-center gap-3"
          aria-label="Back to Kanto League"
        >
          <span className="relative h-10 w-8 shrink-0">
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
          <span className="font-pixel text-[0.55rem] tracking-[0.15em] text-shell-50">
            KANTO LEAGUE
          </span>
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="rounded-card border border-white/10 bg-ink-800/80 p-7 backdrop-blur-sm sm:p-9">
            <h1 className="text-2xl font-bold text-shell-50 sm:text-3xl">
              {isRegister ? 'Claim your trainer profile' : 'Welcome back'}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-shell-200/75">
              {isRegister
                ? 'Use your @slrtce.in address. Your profile and role are created automatically by the database.'
                : 'Sign in with the email address you registered with.'}
            </p>

            {/* ---------------- mode switch ---------------- */}
            <div
              role="tablist"
              aria-label="Sign in or register"
              className="mt-7 grid grid-cols-2 gap-1 rounded-full border border-white/10 bg-ink-950/60 p-1"
            >
              {(['register', 'login'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={mode === value}
                  onClick={() => setMode(value)}
                  className={`rounded-full py-2.5 font-pixel text-[0.55rem] tracking-[0.15em] uppercase transition-colors ${
                    mode === value
                      ? 'bg-ball-500 text-shell-50'
                      : 'text-shell-400 hover:text-shell-100'
                  }`}
                >
                  {value === 'register' ? 'Register' : 'Login'}
                </button>
              ))}
            </div>

            {/* ---------------- form ---------------- */}
            <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4" noValidate>
              {isRegister ? (
                <Field
                  id="full-name"
                  label="Full name"
                  value={fullName}
                  onChange={setFullName}
                  autoComplete="name"
                  required
                />
              ) : null}

              <Field
                id="email"
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
                autoComplete="email"
                inputMode="email"
                placeholder="you@slrtce.in"
                required
              />

              <Field
                id="password"
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                minLength={8}
                required
              />

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

              <button
                type="submit"
                disabled={busy}
                className="mt-2 flex items-center justify-center gap-2 rounded-full border-2 border-ink-900 bg-ball-500 px-6 py-3.5 font-pixel text-xs tracking-wider text-shell-50 uppercase transition-colors hover:bg-ball-400 active:bg-ball-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? 'Working...' : isRegister ? 'Create account' : 'Sign in'}
              </button>
            </form>

            {isRegister ? (
              <p className="mt-6 text-xs leading-relaxed text-shell-600">
                At least 8 characters. Teams, deck uploads and the trainer dashboard land in
                Phase 2 - your account and role already exist by the time you land there.
              </p>
            ) : null}
          </div>

          {/* Honest about what is not built yet, rather than pretending. */}
          <div className="mt-6">
            <EditMe>Phase 2: team formation, deck upload and the trainer dashboard.</EditMe>
          </div>
        </div>
      </main>
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
  return (
    <div>
      <label
        htmlFor={id}
        className="font-pixel text-[0.52rem] tracking-[0.2em] text-shell-400 uppercase"
      >
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-white/10 bg-ink-950/60 px-4 py-3 text-base text-shell-50 transition-colors placeholder:text-shell-600 focus:border-ball-400 focus:outline-none"
        {...rest}
      />
    </div>
  );
}

/**
 * GoTrue error strings are developer-facing. These are the ones a trainer will
 * actually hit, mapped to something a human can act on.
 */
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
