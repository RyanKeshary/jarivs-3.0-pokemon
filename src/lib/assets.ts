/**
 * Single registry for the placeholder art.
 *
 * Two reasons this is centralised rather than imported ad hoc:
 *  1. Every asset carries its intrinsic width/height. Passing those to <img>
 *     lets the browser reserve the box before the file arrives, which is what
 *     keeps CLS at zero. Losing an import means losing those numbers.
 *  2. The transition overlay and the decorative art must be byte-identical, so
 *     they resolve to the same optimised file rather than two copies.
 *
 * To swap in real art: replace the file in src/assets/placeholders/ and run
 * `python scripts/prep-assets.py`. Then update the width/height below to match
 * the new intrinsic size (or it will reserve the wrong amount of space).
 */

import avifMonitor from '../assets/placeholders/monitor.avif?url';
import avifPokedexClose from '../assets/placeholders/pokedex-close.avif?url';
import avifPokedexOpen from '../assets/placeholders/pokedex-open.avif?url';
import avifSeam from '../assets/placeholders/pokeball-seam.avif?url';
import avifTopRed from '../assets/placeholders/pokeball-top-red.avif?url';
import avifBottomWhite from '../assets/placeholders/pokeball-bottom-white.avif?url';
import webpMonitor from '../assets/placeholders/monitor.webp?url';
import webpPokedexClose from '../assets/placeholders/pokedex-close.webp?url';
import webpPokedexOpen from '../assets/placeholders/pokedex-open.webp?url';
import webpSeam from '../assets/placeholders/pokeball-seam.webp?url';
import webpTopRed from '../assets/placeholders/pokeball-top-red.webp?url';
import webpBottomWhite from '../assets/placeholders/pokeball-bottom-white.webp?url';
import pngMonitor from '../assets/placeholders/monitor.png?url';
import pngPokedexClose from '../assets/placeholders/pokedex-close.png?url';
import pngPokedexOpen from '../assets/placeholders/pokedex-open.png?url';
import pngSeam from '../assets/placeholders/pokeball-seam.png?url';
import pngTopRed from '../assets/placeholders/pokeball-top-red.png?url';
import pngBottomWhite from '../assets/placeholders/pokeball-bottom-white.png?url';

export interface ArtAsset {
  avif: string;
  webp: string;
  png: string;
  /** Intrinsic size in px. Always pass these to the <img> to avoid layout shift. */
  width: number;
  height: number;
}

/** Colours sampled from the art itself, so panels blend into the ball seamlessly. */
export const BALL_RED = '#A91D26';
export const BALL_WHITE = '#EDEDED';

export const pokeballTop: ArtAsset = {
  avif: avifTopRed,
  webp: webpTopRed,
  png: pngTopRed,
  width: 442,
  height: 221,
};

export const pokeballBottom: ArtAsset = {
  avif: avifBottomWhite,
  webp: webpBottomWhite,
  png: pngBottomWhite,
  width: 442,
  height: 221,
};

export const monitor: ArtAsset = {
  avif: avifMonitor,
  webp: webpMonitor,
  png: pngMonitor,
  width: 489,
  height: 286,
};

/**
 * Just the ball's seam and button, cut from the two halves by
 * scripts/prep-assets.py. Used as the badge on Pokeball-style cards, where a
 * full half would either swamp the card or stop reading as a ball.
 */
export const pokeballSeam: ArtAsset = {
  avif: avifSeam,
  webp: webpSeam,
  png: pngSeam,
  width: 192,
  height: 156,
};

export const pokedexOpen: ArtAsset = {
  avif: avifPokedexOpen,
  webp: webpPokedexOpen,
  png: pngPokedexOpen,
  width: 169,
  height: 341,
};

export const pokedexClose: ArtAsset = {
  avif: avifPokedexClose,
  webp: webpPokedexClose,
  png: pngPokedexClose,
  width: 192,
  height: 316,
};

/**
 * Where the blue screen sits inside monitor.png, as percentages of the image.
 *
 * Measured from the art (blue-pixel bounding box 57,49 -> 431,229 in the cropped
 * 489x286 image). The countdown renders inside this box, so it has to track any
 * change to the monitor asset - if you swap in a different screen, re-measure.
 */
export const MONITOR_SCREEN = {
  left: '11.66%',
  top: '17.13%',
  width: '76.48%',
  height: '62.94%',
} as const;
