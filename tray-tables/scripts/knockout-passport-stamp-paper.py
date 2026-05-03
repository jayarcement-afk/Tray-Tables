#!/usr/bin/env python3
"""
Make doc stamp PNGs sit on the visa page: knock out near-white mat / paper so only ink + texture
remain on alpha. Run from repo root:

  python3 scripts/knockout-passport-stamp-paper.py

Reads/writes tray-tables/public/imported-passport-stamps/stamp-*-from-doc.png
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
STAMP_DIR = ROOT / "public" / "imported-passport-stamps"
# Corners are always mat; widen band so the square bbox disappears on the visa page.
EDGE_BAND = 20
EDGE_LUM_MIN = 158  # within band: clear light pixels (paper), keep dark ink at edges
# Inner mat: strict so beige / grey stamp art is not punched out
INNER_CHROMA_MAX = 26
INNER_LUM_MIN = 200


def process(path: Path) -> tuple[int, int]:
    im = Image.open(path).convert("RGBA")
    w, h = im.size
    px = im.load()
    cleared = 0
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            mx, mn = max(r, g, b), min(r, g, b)
            chroma = mx - mn
            lum = (r + g + b) / 3
            d_edge = min(x, y, w - 1 - x, h - 1 - y)
            kill = False
            if d_edge < EDGE_BAND and lum >= EDGE_LUM_MIN:
                kill = True
            elif chroma <= INNER_CHROMA_MAX and lum >= INNER_LUM_MIN:
                kill = True
            if kill:
                px[x, y] = (r, g, b, 0)
                cleared += 1
    # Slight blur on alpha only to soften cut lines (0.6px)
    r, g, b, a = im.split()
    a2 = a.filter(ImageFilter.GaussianBlur(radius=0.6))
    im = Image.merge("RGBA", (r, g, b, a2))
    im.save(path, optimize=True)
    return cleared, w * h


def main() -> None:
    paths = sorted(STAMP_DIR.glob("stamp-*-from-doc.png"))
    if not paths:
        raise SystemExit(f"No stamps under {STAMP_DIR}")
    for p in paths:
        cleared, total = process(p)
        print(f"{p.name}: cleared {cleared}/{total} ({100 * cleared / total:.1f}%)")


if __name__ == "__main__":
    main()
