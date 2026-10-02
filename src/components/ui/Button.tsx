import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';

type Variant = 'primary' | 'secondary' | 'ghost';

/**
 * Shared button look.
 *
 * The primary variant is a Pokeball: red shell, white lower band, black seam.
 * Built from divs rather than an image so it stays crisp at any size, costs no
 * request, and its colours come from the same tokens as the art.
 */
const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-ball-500 text-shell-50 shadow-[0_10px_30px_-10px_rgba(169,29,38,0.9)] ' +
    'hover:bg-ball-400 active:bg-ball-600 border-2 border-ink-900',
  secondary:
    'bg-transparent text-shell-100 border-2 border-shell-400/70 hover:border-shell-100 hover:bg-shell-100/10',
  ghost: 'bg-transparent text-shell-400 hover:text-shell-100 border-2 border-transparent hover:border-shell-400/50',
};

interface BaseProps {
  variant?: Variant;
  className?: string;
  children: ReactNode;
}

/** Little white half-disc that reads as the bottom of a Pokeball. */
function BallSeam() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-2 bottom-1.5 h-1.5 rounded-[50%] bg-ink-900"
    />
  );
}

export function Button({
  variant = 'primary',
  className = '',
  children,
  ...rest
}: BaseProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full px-7 py-3.5 font-pixel text-xs uppercase tracking-wider transition-colors duration-200 ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {variant === 'primary' && <BallSeam />}
      <span className="relative">{children}</span>
    </button>
  );
}

export function ButtonLink({
  to,
  variant = 'primary',
  className = '',
  children,
}: BaseProps & { to: string }) {
  return (
    <Link
      to={to}
      className={`relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full px-7 py-3.5 font-pixel text-xs uppercase tracking-wider transition-colors duration-200 ${VARIANTS[variant]} ${className}`}
    >
      {variant === 'primary' && <BallSeam />}
      <span className="relative">{children}</span>
    </Link>
  );
}

/** In-page anchor styled as a button. Scrolls smoothly via CSS, not JS. */
export function ButtonAnchor({
  href,
  variant = 'secondary',
  className = '',
  children,
}: BaseProps & { href: string }) {
  return (
    <a
      href={href}
      className={`relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full px-7 py-3.5 font-pixel text-xs uppercase tracking-wider transition-colors duration-200 ${VARIANTS[variant]} ${className}`}
    >
      {variant === 'primary' && <BallSeam />}
      <span className="relative">{children}</span>
    </a>
  );
}

/**
 * A glassy panel with a red top edge - the base look for every content card on
 * the page. Exported as a class string rather than a component so callers can
 * apply it to <section>, <article> or <li> as appropriate.
 */
/**
 * A glassy panel with a red top edge - the base look for every content card on
 * the page. Exported as a class string rather than a component so callers can
 * apply it to <section>, <article> or <li> as appropriate.
 */
export const panelClass =
  'relative overflow-hidden rounded-card border border-white/10 bg-ink-800/70 ' +
  'backdrop-blur-sm transition-colors duration-300';
