"""Regenerate the app icons from branding/paks-unity-road-logo.jpg.

The source JPG has a black background; it is flood-filled from the edges to transparent so the
logo's own shape (circle + ribbon) is kept. Run from the repo root:  python branding/make-icons.py
"""
from collections import deque
from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'branding' / 'paks-unity-road-logo.jpg'
OUT = ROOT / 'public'
BG = (6, 78, 59, 255)  # theme_color #064e3b, used where a solid background is required
THRESHOLD = 45  # max channel value still treated as background black


def cut_out(im: Image.Image) -> Image.Image:
    im = im.convert('RGB')
    w, h = im.size
    px = im.load()
    bg = bytearray(w * h)
    q = deque()
    for x in range(w):
        q.extend([(x, 0), (x, h - 1)])
    for y in range(h):
        q.extend([(0, y), (w - 1, y)])
    while q:
        x, y = q.popleft()
        i = y * w + x
        if bg[i] or max(px[x, y]) > THRESHOLD:
            continue
        bg[i] = 1
        if x > 0: q.append((x - 1, y))
        if x < w - 1: q.append((x + 1, y))
        if y > 0: q.append((x, y - 1))
        if y < h - 1: q.append((x, y + 1))
    alpha = Image.frombytes('L', (w, h), bytes(0 if b else 255 for b in bg))
    alpha = alpha.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.2))  # soft edge
    out = im.convert('RGBA')
    out.putalpha(alpha)
    return out.crop(out.getbbox())


def square(logo: Image.Image, size: int, scale: float = 1.0, bg=None) -> Image.Image:
    canvas = Image.new('RGBA', (size, size), bg or (0, 0, 0, 0))
    inner = round(size * scale)
    l = logo.copy()
    l.thumbnail((inner, inner), Image.LANCZOS)
    canvas.alpha_composite(l, ((size - l.width) // 2, (size - l.height) // 2))
    return canvas


def main():
    logo = cut_out(Image.open(SRC))
    def save(img, rel):
        # 256-colour palette (alpha kept) cuts the photo-style PNGs to roughly a third of the size
        img.quantize(256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.FLOYDSTEINBERG).save(OUT / rel, optimize=True)
    save(square(logo, 512), 'icons/icon-512.png')
    save(square(logo, 192), 'icons/icon-192.png')
    save(square(logo, 512, 0.78, BG), 'icons/maskable-512.png')  # inside the maskable safe zone
    save(square(logo, 180, 0.92, BG).convert('RGB'), 'icons/apple-touch-icon.png')  # iOS: no transparency
    save(square(logo, 256), 'icons/logo-256.png')  # header + thank-you popup
    save(square(logo, 48), 'favicon-48.png')
    save(square(logo, 32), 'favicon-32.png')


if __name__ == '__main__':
    main()
