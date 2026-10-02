# Placeholder art

Everything in this folder is a **placeholder**. Swap it for the real art and the
app picks up the change with no code edits, as long as you keep the filenames.

| File                  | Used by                                              |
| --------------------- | ---------------------------------------------------- |
| `pokeball-top-red`    | Intro transition (red half), card decoration          |
| `pokeball-bottom-white` | Intro transition (white half), card decoration      |
| `pokeball-seam`       | Card headers and the route-map node                   |
| `monitor`             | The hero countdown ("stadium screen")                 |
| `pokedex-open`        | Navbar logo on hover, hero background                 |
| `pokedex-close`       | Navbar logo, auth page, footer                        |

## How the files are produced

`npm run assets:prep` (needs Python + Pillow) reads the source PNGs in the repo
root, crops away fully-transparent padding, and writes three formats per asset:
AVIF, WebP and PNG. The app picks the best one the browser supports via
`<picture>`, so a modern browser downloads ~4KB where the original was ~65KB.

`pokeball-seam` is not a source file - it is cut out of the two ball halves by
the same script, so the card headers stay in sync with the transition art
automatically.

## If you replace the art

1. Put the new PNG in the repo root with the matching name.
2. Run `npm run assets:prep`.
3. Update the `width` / `height` in `src/lib/assets.ts` to the new intrinsic
   size. **This matters**: the app uses those numbers to reserve space before the
   image loads, and wrong numbers cause layout shift.
4. If you replace `monitor`, re-measure `MONITOR_SCREEN` in the same file - it is
   the position of the blue screen as a percentage of the image, and the
   countdown is drawn inside it. Find the blue pixels' bounding box and divide.

## The intro video

`public/media/intro-theme.mp4` is a 60-second, 4.0MB, 640x480 H.264 file. It is
the single heaviest asset on the site and it is the reason a first visit cannot
hit a top Lighthouse performance score - see the performance notes in the root
README. It is only fetched by visitors whose session has not seen it yet.
