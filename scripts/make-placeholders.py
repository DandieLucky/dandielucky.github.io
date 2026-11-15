#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generate placeholder imagery for the portfolio.

Setiap file yang dihasilkan skrip ini adalah PLACEHOLDER: desainnya netral dan
sengaja tidak memakai karya asli. Setiap file membawa penanda byte "SLOT ASET"
(komentar JPEG / teks PNG) sehingga `npm run check-assets` bisa membedakan
placeholder dari aset asli tanpa menebak dari ukuran file.

Pemakaian:
    python3 scripts/make-placeholders.py                 # buat semua placeholder
    python3 scripts/make-placeholders.py --skip og.png   # jangan sentuh og.png
"""
from __future__ import annotations

import json
import os
import pathlib
import sys

from PIL import Image, ImageDraw, ImageFont, PngImagePlugin

ROOT = pathlib.Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
MANIFEST = ROOT / "src" / "data" / "assets.json"

MARKER = "SLOT ASET"

# file yang memang final by design — jangan pernah muncul sebagai "slot kosong"
NO_SLOT = {"/apple-touch-icon.png"}

FONT_DIRS = [
    "/System/Library/Fonts/Supplemental",
    "/System/Library/Fonts",
    "/Library/Fonts",
    os.path.expanduser("~/Library/Fonts"),
]

SERIF = ["Georgia.ttf", "Times New Roman.ttf", "Times.ttf", "Palatino.ttc"]
SANS = ["Arial.ttf", "Helvetica.ttc", "HelveticaNeue.ttc", "Verdana.ttf"]


def find_font(candidates, size):
    for name in candidates:
        for d in FONT_DIRS:
            p = os.path.join(d, name)
            if os.path.exists(p):
                try:
                    return ImageFont.truetype(p, size)
                except Exception:
                    continue
    return ImageFont.load_default()


# Daftar proyek mengikuti folder Assets/ (lihat scripts/import-assets.mjs).
# Aset asli sudah masuk lewat skrip impor; pembuat placeholder tetap disimpan
# untuk berjaga-jaga kalau ada slot baru.
PALETTES = {
    "matahari-grosir": {"bg": "#F2E8DA", "ink": "#2B2118", "accent": "#C4632B"},
    "olimpiade-polimedia-2025": {"bg": "#16283F", "ink": "#F5EFE3", "accent": "#E0A458"},
    "pkkmb-polimedia-2026": {"bg": "#1C3F5E", "ink": "#F2F5F8", "accent": "#E0A458"},
    "pusinfomar": {"bg": "#E9EBED", "ink": "#1A2430", "accent": "#2F6F8F"},
    "darya-varia": {"bg": "#3A1F2B", "ink": "#F6E9D8", "accent": "#C9A227"},
    "posh-by-her": {"bg": "#F3E5E3", "ink": "#3A2A2A", "accent": "#B4736A"},
    "wilhelmina-cup-2024": {"bg": "#F1EFE6", "ink": "#20241F", "accent": "#4A6B4F"},
    "si-paling-film": {"bg": "#20242B", "ink": "#F2F0EA", "accent": "#B85C38"},
    "bnsp": {"bg": "#EFF1F3", "ink": "#1B2531", "accent": "#2F6F8F"},
}

PROJECTS = [
    ("matahari-grosir", "Matahari Grosir", "Konten media sosial · 2025—sekarang"),
    ("olimpiade-polimedia-2025", "Olimpiade Polimedia", "Identitas event kampus · 2025"),
    ("pkkmb-polimedia-2026", "PKKMB Polimedia", "Konten pengenalan kampus · 2026"),
    ("pusinfomar", "Pusinfomar", "UI/UX aplikasi internal · 2026"),
    ("darya-varia", "Darya Varia 50", "Motion graphics · 2026"),
    ("posh-by-her", "Posh by Her", "Fotografi produk · 2026"),
    ("wilhelmina-cup-2024", "Wilhelmina Cup", "Identitas visual acara · 2024"),
    ("si-paling-film", "Si Paling Film", "Penyuntingan video konten"),
    ("bnsp", "BNSP", "Materi pelatihan & dokumentasi"),
]

generated: dict[str, str] = {}


def save(img: Image.Image, rel: str, note: str) -> None:
    out = PUBLIC / rel.lstrip("/")
    out.parent.mkdir(parents=True, exist_ok=True)
    if rel.endswith(".jpg"):
        img.convert("RGB").save(
            out, "JPEG", quality=86, optimize=True, progressive=True,
            comment=MARKER.encode("ascii"),
        )
    elif rel.endswith(".png"):
        meta = PngImagePlugin.PngInfo()
        meta.add_text("Marker", MARKER)
        img.save(out, "PNG", pnginfo=meta)
    else:
        img.save(out)
    if rel not in NO_SLOT:
        generated[rel] = note
    print("  ", rel, f"{out.stat().st_size // 1024} KB")


def shapes(w: int, h: int, accent: str, seed: int) -> Image.Image:
    """komposisi geometris sederhana, berbeda per proyek"""
    a = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    da = ImageDraw.Draw(a)
    if seed % 3 == 0:
        da.ellipse([w * 0.52, h * 0.08, w * 1.06, h * 0.62], fill=accent + "33")
        da.rectangle([w * 0.06, h * 0.66, w * 0.44, h * 0.92], fill=accent + "22")
    elif seed % 3 == 1:
        da.rectangle([w * 0.58, 0, w * 0.86, h], fill=accent + "26")
        da.ellipse([w * 0.62, h * 0.52, w * 1.02, h * 1.02], fill=accent + "33")
    else:
        da.polygon([(w * 0.52, h), (w * 0.86, 0), (w, 0), (w, h)], fill=accent + "22")
        da.ellipse([w * 0.06, h * 0.1, w * 0.34, h * 0.38], fill=accent + "30")
    return Image.alpha_composite(Image.new("RGBA", (w, h), (0, 0, 0, 0)), a)


def cover(slug: str, title: str, sub: str, seed: int) -> Image.Image:
    pal = PALETTES[slug]
    w, h = 1600, 1200
    img = Image.new("RGB", (w, h), pal["bg"])
    img = Image.alpha_composite(img.convert("RGBA"), shapes(w, h, pal["accent"], seed)).convert("RGB")
    d = ImageDraw.Draw(img)

    mono = find_font(SANS, 34)
    serif_small = find_font(SERIF, 64)

    d.text((96, 84), f"{seed + 1:02d}", font=mono, fill=pal["accent"])

    words = title.split()
    lines, cur = [], ""
    for word in words:
        test = (cur + " " + word).strip()
        if d.textlength(test, font=serif_small) > w * 0.5 and cur:
            lines.append(cur)
            cur = word
        else:
            cur = test
    if cur:
        lines.append(cur)

    y = h - 96 - len(lines) * 78
    for line in lines:
        d.text((96, y), line, font=serif_small, fill=pal["ink"])
        y += 78

    d.text((96, h - 74), sub.upper(), font=mono, fill=pal["ink"])
    d.line([(96, h - 100), (96 + 120, h - 100)], fill=pal["accent"], width=4)
    d.text((96, 84), "SLOT ASET", font=mono, fill=pal["accent"])
    return img


def process(idx: int, palette: dict) -> Image.Image:
    w, h = 1200, 900
    img = Image.new("RGB", (w, h), palette["bg"])
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, w, 8], fill=palette["accent"])
    big = find_font(SERIF, 220)
    mono = find_font(SANS, 28)
    ink = palette["ink"]
    d.text((70, 40), f"{idx:02d}", font=big, fill=palette["accent"])
    for i in range(4):
        y = h - 190 - i * 30
        d.line([(80, y), (w - 80 - i * 60, y)], fill=ink, width=1)
    d.text((80, h - 110), "SLOT ASET — GANTI DENGAN FILE ASLI", font=mono, fill=ink)
    return img


def neutral(w: int, h: int, mono_text: str, big_text: str, bg: str, ink: str, accent: str) -> Image.Image:
    img = Image.new("RGB", (w, h), bg)
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, w, 10], fill=accent)
    d.text((w * 0.06, h * 0.12), mono_text.upper(), font=find_font(SANS, int(h * 0.035)), fill=ink)
    d.text((w * 0.06, h * 0.52), big_text, font=find_font(SERIF, int(h * 0.16)), fill=ink)
    return img


def parse_skips() -> list[str]:
    """--skip <teks> atau --skip=<teks>; file yang path-nya memuat teks itu dilewati."""
    out: list[str] = []
    args = sys.argv[1:]
    i = 0
    while i < len(args):
        a = args[i]
        if a == "--skip" and i + 1 < len(args):
            out.append(args[i + 1])
            i += 2
        elif a.startswith("--skip="):
            out.append(a.split("=", 1)[1])
            i += 1
        else:
            i += 1
    return out


def main() -> None:
    PUBLIC.mkdir(exist_ok=True)
    skips = parse_skips()
    print("Membuat placeholder…" + (f" (lewati: {', '.join(skips)})" if skips else ""))

    pal = PALETTES["posh-by-her"]
    slots: list[tuple[str, str, object]] = []
    for i, (slug, title, sub) in enumerate(PROJECTS):
        slots.append((
            f"/assets/work/{slug}/cover.jpg", "cover 1600×1200",
            lambda s=slug, t=title, u=sub, n=i: cover(s, t, u, n),
        ))
        for n in range(1, 4):
            slots.append((
                f"/assets/work/{slug}/proses-{n:02d}.jpg", f"slot proses {n} · 1200×900",
                lambda s=slug, k=n: process(k, PALETTES[s]),
            ))

    slots += [
        ("/assets/work/posh-by-her/before.jpg", "before 1200×900",
         lambda: neutral(1200, 900, "before · raw", "Sebelum", pal["bg"], pal["ink"], pal["accent"])),
        ("/assets/work/posh-by-her/after.jpg", "after 1200×900",
         lambda: neutral(1200, 900, "after · retouched", "Sesudah", pal["bg"], pal["ink"], pal["accent"])),
        ("/assets/about/portrait.jpg", "portrait 1200×1500",
         lambda: neutral(1200, 1500, "foto menyusul", "DLM", "#EFEBE3", "#20241F", "#1C3F5E")),
        ("/assets/og.png", "OG image 1200×630",
         lambda: neutral(1200, 630, "dandielucky.com", "Dandie Lucky Maulana", "#F8F6F1", "#12141A", "#1C3F5E")),
        ("/apple-touch-icon.png", "touch icon 180×180",
         lambda: neutral(180, 180, "", "D.", "#1C3F5E", "#F8F6F1", "#F8F6F1")),
    ]

    for rel, note, make in slots:
        if any(needle in rel for needle in skips):
            exists = (PUBLIC / rel.lstrip("/")).exists()
            if exists and rel not in NO_SLOT:
                generated[rel] = note
            print("   dilewati:", rel, "(file ada)" if exists else "(file BELUM ADA — periksa!)")
            continue
        save(make(), rel, note)

    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(generated, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"\n{len(generated)} slot tercatat → {MANIFEST.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
