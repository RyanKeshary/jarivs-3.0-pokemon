import type { ReactNode } from 'react';

import { Reveal } from './Reveal';

interface SectionShellProps {
  id: string;
  eyebrow: string;
  heading: string;
  lede?: string;
  children: ReactNode;
  className?: string;
  /** Aligns content to the left instead of centring. Used by the route map. */
  align?: 'center' | 'left';
}

/**
 * Common frame for a landing-page section: id (for navbar anchors), eyebrow,
 * heading and optional lede, then the section body.
 *
 * A min-height is set so that a lazily-loaded section still reserves space while
 * its chunk is in flight. Without it, each code-split section would collapse to
 * zero height for a moment and shove the page around as the user scrolled.
 */
export function SectionShell({
  id,
  eyebrow,
  heading,
  lede,
  children,
  className = '',
  align = 'center',
}: SectionShellProps) {
  const centered = align === 'center';

  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className={`relative mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 sm:py-28 ${className}`}
    >
      <Reveal className={centered ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}>
        <p className="font-pixel text-[0.6rem] uppercase tracking-[0.35em] text-ball-400">
          {eyebrow}
        </p>
        <h2
          id={`${id}-heading`}
          className="mt-4 text-3xl font-bold tracking-tight text-balance text-shell-50 sm:text-4xl md:text-5xl"
        >
          {heading}
        </h2>
        {lede ? (
          <p
            className={`mt-5 text-base leading-relaxed text-pretty text-shell-200/80 sm:text-lg ${
              centered ? 'mx-auto' : ''
            }`}
          >
            {lede}
          </p>
        ) : null}
      </Reveal>

      <div className="mt-12 sm:mt-16">{children}</div>
    </section>
  );
}
