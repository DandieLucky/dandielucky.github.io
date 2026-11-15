#!/usr/bin/env node
/**
 * Versi kecil dari foto profil untuk bayangan samar di latar HP.
 *
 * Hasil: public/assets/hero/ghost.jpg — 360 px lebar, blur ringan, ±8 KB.
 *
 * Ditulis dengan sharp (sudah dipakai scripts/import-assets.mjs) supaya build
 * di GitHub Actions tidak butuh Python + Pillow. Kalau foto profil belum ada,
 * skrip ini hanya memberi tahu dan tidak menggagalkan build.
 */
import { access, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const AKAR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SUMBER = path.join(AKAR, 'public/assets/about/portrait.jpg');
const TUJUAN = path.join(AKAR, 'public/assets/hero/ghost.jpg');
const LEBAR = 360;

try {
  await access(SUMBER);
} catch {
  console.log('foto profil belum ada — lewati ghost.jpg');
  process.exit(0);
}

await mkdir(path.dirname(TUJUAN), { recursive: true });
await sharp(SUMBER)
  .resize({ width: LEBAR })
  .blur(1.6)
  .jpeg({ quality: 72, mozjpeg: true, progressive: true })
  .toFile(TUJUAN);

const { size } = await import('node:fs/promises').then((fs) => fs.stat(TUJUAN));
console.log(`ghost.jpg ${LEBAR}px · ${Math.round(Number(size) / 1024)} KB`);
