import type { ReactNode } from 'react';

import { Art } from './Art';
import { panelClass } from './Button';
import { pokeballSeam } from '../../lib/assets';

interface PokeballCardProps {
  title: string;
  children: ReactNode;
  /** Varies the accent rotation so a row of cards is not perfectly uniform. */
  index?: number;
  className?: string;
}

/**
 * "Pokeball-style card".
 *
 * The header is a strip cut from the middle of the ball - red shell above the
 * seam, black band, white button - so the card is unmistakably a Pokeball rather
 * than just a panel with a red line on it. Under it sits a red gradient that
 * fades to transparent, echoing the ball's upper half.
 *
 * The seam asset is derived from the same two PNGs the intro transition uses
 * (see scripts/prep-assets.py), so there is no separate art to supply.
 */
export function PokeballCard({ title, children, index = 0, className = '' }: PokeballCardProps) {
  // Alternate the glow position slightly per card so a row of three has some
  // variation without looking random.
  const glow = index % 2 === 0 ? 'left-1/4' : 'right-1/4';

  return (
    <article className={`${panelClass} group flex h-full flex-col ${className}`}>
      {/* red wash under the header, echoing the top half of the ball */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute top-0 left-0 h-32 w-32 -translate-x-1/3 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(169,29,38,0.55),transparent_70%)] blur-2xl transition-opacity duration-300 group-hover:opacity-80 ${glow}`}
      />

      <div className="relative flex items-center gap-4 px-6 pt-6 pb-1">
        <Art asset={pokeballSeam} alt="" className="h-11 w-auto shrink-0 select-none" />
        <h3 className="text-lg leading-tight font-bold text-balance text-shell-50 sm:text-xl">
          {title}
        </h3>
      </div>

      {/* the seam itself: a hard black line under the red, like the ball's band */}
      <div
        aria-hidden="true"
        className="mt-4 h-1.5 w-full bg-linear-to-r from-ball-700 via-ball-400 to-ball-700"
      />

      <div className="flex flex-1 flex-col px-6 pt-5 pb-7 text-sm leading-relaxed text-shell-200/80">
        {children}
      </div>
    </article>
  );
}
