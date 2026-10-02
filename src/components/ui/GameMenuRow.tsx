import type { ReactNode } from 'react';

/**
 * A single row in the "in-game menu" list of Event Details.
 *
 * The left column is a fixed-width gutter so every value on the page starts at
 * the same x position - that alignment is most of what makes a menu read as a
 * menu rather than as loose text.
 */
export function GameMenuRow({
  title,
  value,
  blurb,
  /** Highlights the row, e.g. the registration deadline when it is nearly here. */
  tone = 'default',
}: {
  title: string;
  value: ReactNode;
  blurb?: ReactNode;
  tone?: 'default' | 'urgent' | 'muted';
}) {
  const toneClass =
    tone === 'urgent'
      ? 'border-ball-400/50 bg-ball-500/10'
      : tone === 'muted'
        ? 'border-white/5 bg-white/[0.02]'
        : 'border-white/10 bg-ink-800/60 hover:border-ball-400/40';

  return (
    <li
      className={`group relative grid grid-cols-1 gap-1 rounded-xl border px-4 py-4 transition-colors duration-200 sm:grid-cols-[minmax(9rem,13rem)_1fr] sm:items-baseline sm:gap-6 ${toneClass}`}
    >
      {/* Selector arrow, the way a game menu marks the active entry. */}
      <span
        aria-hidden="true"
        className="absolute -left-0.5 top-1/2 hidden -translate-y-1/2 text-ball-400 opacity-0 transition-opacity duration-200 group-hover:opacity-100 sm:block"
      >
        ▶
      </span>

      <span className="font-pixel text-[0.58rem] uppercase tracking-[0.2em] text-shell-400">
        {title}
      </span>

      <span className="text-base leading-relaxed text-shell-50 sm:text-lg">
        {value}
        {blurb ? <span className="mt-1 block text-sm text-shell-200/70">{blurb}</span> : null}
      </span>
    </li>
  );
}
