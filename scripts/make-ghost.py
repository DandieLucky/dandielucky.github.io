#!/usr/bin/env python3
"""Versi sangat kecil dari foto profil untuk bayangan samar di HP.

Hasil: public/assets/hero/ghost.jpg — 360 px lebar, blur ringan, JPG ~10 KB.
Dipakai sebagai lapisan latar di layar kecil saja (CSS media query).
"""
from pathlib import Path
from PIL import Image, ImageFilter

AKAR = Path(__file__).resolve().parent.parent
SUMBER = AKAR / 'public/assets/about/portrait.jpg'
TUJUAN = AKAR / 'public/assets/hero/ghost.jpg'

def main() -> None:
    if not SUMBER.exists():
        print('foto profil belum ada — lewati')
        return
    im = Image.open(SUMBER).convert('RGB')
    lebar = 360
    im = im.resize((lebar, round(im.height * lebar / im.width)), Image.LANCZOS)
    im = im.filter(ImageFilter.GaussianBlur(1.6))
    TUJUAN.parent.mkdir(parents=True, exist_ok=True)
    im.save(TUJUAN, 'JPEG', quality=72, optimize=True, progressive=True)
    print(f'ghost.jpg {im.width}x{im.height} · {TUJUAN.stat().st_size / 1024:.0f} KB')

if __name__ == '__main__':
    main()
