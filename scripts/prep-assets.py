#!/usr/bin/env python3
import os
import shutil
import sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "raw-assets")
OUT_PUBLIC = os.path.join(ROOT, "public", "assets", "placeholders")
OUT_MEDIA = os.path.join(ROOT, "public", "media")

SOURCES = {
    "pokeball top red.png": "pokeball-top-red",
    "pokeball bottom white.png": "pokeball-bottom-white",
    "monitor.png": "monitor",
    "pokedex open.png": "pokedex-open",
    "pokedex close.png": "pokedex-close",
}

WEBP_QUALITY = 92
AVIF_QUALITY = 55
SEAM_BAND = 78
SEAM_HALF = 96

def make_seam_ball(out_dir):
    top_path = os.path.join(RAW, "pokeball top red.png")
    bottom_path = os.path.join(RAW, "pokeball bottom white.png")
    top = Image.open(top_path).convert("RGBA").crop(Image.open(top_path).getbbox())
    bottom = Image.open(bottom_path).convert("RGBA").crop(Image.open(bottom_path).getbbox())

    cx = top.width // 2
    strip = Image.new("RGBA", (top.width, SEAM_BAND * 2), (0, 0, 0, 0))
    strip.paste(top.crop((0, top.height - SEAM_BAND, top.width, top.height)), (0, 0))
    strip.paste(bottom.crop((0, 0, bottom.width, SEAM_BAND)), (0, SEAM_BAND))

    seam = strip.crop((cx - SEAM_HALF, 0, cx + SEAM_HALF, SEAM_BAND * 2))
    seam.save(os.path.join(out_dir, "pokeball-seam.png"), "PNG", optimize=True)
    seam.save(os.path.join(out_dir, "pokeball-seam.webp"), "WEBP", quality=WEBP_QUALITY, method=6)
    try:
        seam.save(os.path.join(out_dir, "pokeball-seam.avif"), "AVIF", quality=AVIF_QUALITY)
    except Exception as err:
        print(f"  ! AVIF unavailable for seam ({err})")
    return seam.size

def main():
    os.makedirs(OUT_PUBLIC, exist_ok=True)
    os.makedirs(OUT_MEDIA, exist_ok=True)

    # Copy video if present
    video_src = os.path.join(RAW, "video.mp4")
    video_dest = os.path.join(OUT_MEDIA, "intro-theme.mp4")
    if os.path.exists(video_src) and not os.path.exists(video_dest):
        print(f"Copying {video_src} -> {video_dest}")
        shutil.copy2(video_src, video_dest)

    for src, stem in SOURCES.items():
        src_path = os.path.join(RAW, src)
        if not os.path.exists(src_path):
            print(f"Warning: {src_path} missing")
            continue
        image = Image.open(src_path).convert("RGBA")
        cropped = image.crop(image.getbbox())

        png_path = os.path.join(OUT_PUBLIC, f"{stem}.png")
        webp_path = os.path.join(OUT_PUBLIC, f"{stem}.webp")
        avif_path = os.path.join(OUT_PUBLIC, f"{stem}.avif")

        cropped.save(png_path, "PNG", optimize=True)
        cropped.save(webp_path, "WEBP", quality=WEBP_QUALITY, method=6)
        try:
            cropped.save(avif_path, "AVIF", quality=AVIF_QUALITY)
        except Exception as err:
            pass
        print(f"Prepared {stem} into public/assets/placeholders/")

    make_seam_ball(OUT_PUBLIC)
    print("Asset preparation completed successfully.")

if __name__ == "__main__":
    main()
