#!/usr/bin/env python3
"""
Prepares the placeholder art in src/assets/placeholders/.

For every source PNG it:
  1. crops away fully-transparent padding (getbbox) so the file carries no dead space
  2. writes a lossy WebP and an AVIF alongside the PNG

Why three formats: <picture> picks the best one the browser supports, so modern
browsers download ~4KB instead of ~60KB. The PNG stays as the universal fallback.

Swap any of these with real art and re-run this script; the filenames are the
contract, nothing else in the app cares about pixel dimensions.

Requires Pillow:  pip install pillow
Usage:            python scripts/prep-assets.py
"""
import os
import sys

try:
    from PIL import Image
except ImportError:
    sys.exit("Pillow is not installed. Run:  pip install pillow")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "raw-assets") if os.path.isdir(os.path.join(ROOT, "raw-assets")) else ROOT
OUT = os.path.join(ROOT, "src", "assets", "placeholders")

# source filename -> output stem
SOURCES = {
    "pokeball top red.png": "pokeball-top-red",
    "pokeball bottom white.png": "pokeball-bottom-white",
    "monitor.png": "monitor",
    "pokedex open.png": "pokedex-open",
    "pokedex close.png": "pokedex-close",
}

WEBP_QUALITY = 92
AVIF_QUALITY = 55

# The two halves are each 442x221 and join at a horizontal seam, so the centre of
# the ball sits on the boundary between them. SEAM_BAND is how many rows to take
# from each side; SEAM_HALF is how far either side of the button to keep.
#
# These are tuned by eye: too tight and you get a grey button with no ball around
# it, which does not read as a Pokeball at card-header size.
SEAM_BAND = 78
SEAM_HALF = 96


def make_seam_ball():
    """
    Cuts the button-and-seam out of the two halves and saves it as its own asset.

    The card headers use this instead of stretching a whole half: at card width a
    full half is either 200px tall (and swamps the card) or so squashed it stops
    reading as a ball. The seam is the recognisable part, so we keep just that.
    """
    top = Image.open(os.path.join(RAW, "pokeball top red.png")).convert("RGBA").crop(
        Image.open(os.path.join(RAW, "pokeball top red.png")).getbbox()
    )
    bottom = Image.open(os.path.join(RAW, "pokeball bottom white.png")).convert("RGBA").crop(
        Image.open(os.path.join(RAW, "pokeball bottom white.png")).getbbox()
    )

    cx = top.width // 2
    strip = Image.new("RGBA", (top.width, SEAM_BAND * 2), (0, 0, 0, 0))
    strip.paste(top.crop((0, top.height - SEAM_BAND, top.width, top.height)), (0, 0))
    strip.paste(bottom.crop((0, 0, bottom.width, SEAM_BAND)), (0, SEAM_BAND))

    seam = strip.crop((cx - SEAM_HALF, 0, cx + SEAM_HALF, SEAM_BAND * 2))
    seam.save(os.path.join(OUT, "pokeball-seam.png"), "PNG", optimize=True)
    seam.save(os.path.join(OUT, "pokeball-seam.webp"), "WEBP", quality=WEBP_QUALITY, method=6)
    try:
        seam.save(os.path.join(OUT, "pokeball-seam.avif"), "AVIF", quality=AVIF_QUALITY)
    except (ValueError, OSError) as err:
        print(f"  ! AVIF unavailable for seam ({err})")
    return seam.size


def main() -> int:
    os.makedirs(OUT, exist_ok=True)
    missing = [s for s in SOURCES if not os.path.exists(os.path.join(RAW, s))]
    if missing:
        print(f"Missing source art (expected in {RAW}):")
        for m in missing:
            print(f"  - {m}")
        return 1

    for src, stem in SOURCES.items():
        image = Image.open(os.path.join(RAW, src)).convert("RGBA")
        cropped = image.crop(image.getbbox())  # drop transparent padding

        paths = {
            "png": os.path.join(OUT, f"{stem}.png"),
            "webp": os.path.join(OUT, f"{stem}.webp"),
            "avif": os.path.join(OUT, f"{stem}.avif"),
        }
        cropped.save(paths["png"], "PNG", optimize=True)
        cropped.save(paths["webp"], "WEBP", quality=WEBP_QUALITY, method=6)
        try:
            cropped.save(paths["avif"], "AVIF", quality=AVIF_QUALITY)
        except (ValueError, OSError) as err:
            print(f"  ! AVIF unavailable for {stem} ({err}) - browser will fall back")

        sizes = "  ".join(
            f"{ext} {os.path.getsize(p) / 1024:6.1f} KB" for ext, p in paths.items() if os.path.exists(p)
        )
        original = os.path.getsize(os.path.join(RAW, src))
        print(f"{stem:24s} {str(cropped.size):12s} {sizes}   (was {original / 1024:.1f} KB)")

    size = make_seam_ball()
    total = sum(
        os.path.getsize(os.path.join(OUT, f))
        for f in os.listdir(OUT)
        if f.endswith((".png", ".webp", ".avif"))
    )
    print(f"{'pokeball-seam':24s} {str(size):12s}   (derived from the two halves)")
    print(f"\nall formats together: {total / 1024:.1f} KB")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
