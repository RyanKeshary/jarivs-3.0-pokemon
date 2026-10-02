import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

import { Art } from '../ui/Art';
import { BALL_RED, BALL_WHITE, pokeballBottom, pokeballTop } from '../../lib/assets';

/**
 * The Pokeball wipe: two halves sit joined over the landing page, then the red
 * half slides up and out and the white half slides down and out.
 *
 * How the geometry works
 * ---------------------
 * Each panel is exactly half the viewport tall and filled with a solid colour
 * sampled from the ball itself (#A91D26 / #EDEDED). The matching ball art is
 * then anchored to the shared seam, sized to 200vh wide and therefore exactly
 * 100vh tall - so the two images together form a square ball exactly as tall as
 * the screen, meeting precisely at the middle.
 *
 * Because the panel colour is the ball colour, the transparent corners of the art
 * disappear into the panel and the ball reads as one enormous sphere rather than
 * as a small picture floating on a colour block. It also means the wipe still
 * covers the whole screen on an unusually wide or short viewport, where the ball
 * art alone would leave a gap.
 *
 * Performance
 * -----------
 * Only `transform` is animated, so both halves stay on the compositor and no
 * layout or paint happens during the wipe. `will-change` is set for the duration
 * of the animation only.
 */
export function PokeballTransition({ onComplete }: { onComplete: () => void }) {
  const reduceMotion = useReducedMotion();
  const [done, setDone] = useState(false);

  // Under reduced motion we skip the wipe entirely: the page is simply revealed.
  const duration = reduceMotion ? 0 : 0.85;

  useEffect(() => {
    if (duration === 0) {
      onComplete();
      return;
    }
    const timer = setTimeout(() => {
      setDone(true);
      onComplete();
    }, duration * 1000);
    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  if (done) return null;

  // easeInOutQuart: a slow start, a fast middle, a soft landing. Reads as weight.
  const ease = [0.76, 0, 0.24, 1] as const;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-40 overflow-hidden"
      // Announced as decorative: it conveys nothing a screen reader needs.
      aria-hidden="true"
    >
      {/* ---------------- red half: slides up and out ---------------- */}
      <motion.div
        className="absolute inset-x-0 top-0 h-1/2 overflow-hidden"
        style={{ backgroundColor: BALL_RED, willChange: 'transform' }}
        initial={{ y: 0 }}
        animate={{ y: '-101%' }}
        transition={{ duration, ease }}
      >
        <Art
          asset={pokeballTop}
          alt=""
          className="absolute bottom-0 left-1/2 w-[200vh] max-w-none -translate-x-1/2 select-none"
        />
      </motion.div>

      {/* ---------------- white half: slides down and out ---------------- */}
      <motion.div
        className="absolute inset-x-0 bottom-0 h-1/2 overflow-hidden"
        style={{ backgroundColor: BALL_WHITE, willChange: 'transform' }}
        initial={{ y: 0 }}
        animate={{ y: '101%' }}
        transition={{ duration, ease }}
      >
        <Art
          asset={pokeballBottom}
          alt=""
          className="absolute top-0 left-1/2 w-[200vh] max-w-none -translate-x-1/2 select-none"
        />
      </motion.div>
    </div>
  );
}
