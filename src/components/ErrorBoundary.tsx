import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches render-time failures and shows something useful instead of a blank
 * page.
 *
 * The most likely error here is the Supabase configuration check in
 * lib/supabase.ts, which throws a message telling the developer exactly which
 * env var is missing. Rendering that verbatim is far more useful than a generic
 * "something went wrong".
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Real apps would ship this to Sentry. Logging keeps the stack visible in
    // devtools during development without pulling in a dependency.
    console.error('Unhandled error in render tree:', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-900 px-5 py-16">
        <div className="w-full max-w-xl rounded-card border border-ball-500/40 bg-ink-800 p-8">
          <p className="font-pixel text-[0.55rem] tracking-[0.25em] text-ball-400 uppercase">
            Something broke
          </p>
          <h1 className="mt-4 text-2xl font-bold text-shell-50">Kanto League could not load</h1>
          <pre className="mt-5 overflow-x-auto rounded-lg border border-white/10 bg-ink-950 p-4 text-xs leading-relaxed whitespace-pre-wrap text-shell-200">
            {error.message}
          </pre>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 rounded-full border-2 border-shell-100/30 px-5 py-2.5 font-pixel text-[0.55rem] tracking-[0.2em] text-shell-100 uppercase transition hover:border-shell-100/70"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}
