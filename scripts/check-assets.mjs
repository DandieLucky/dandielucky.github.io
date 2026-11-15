#!/usr/bin/env node
/**
 * Cek aset: mana yang masih placeholder, mana yang sudah diganti file asli.
 * Jalankan: npm run check-assets
 */
import { readFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = join(root, 'src/data/assets.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

const RED = '\u001b[31m';
const GREEN = '\u001b[32m';
const DIM = '\u001b[2m';
const RESET = '\u001b[0m';

let pending = [];
let replaced = [];
let missing = [];

for (const [rel, spec] of Object.entries(manifest)) {
  const file = join(root, 'public', rel.replace(/^\//, ''));
  if (!existsSync(file)) {
    missing.push(rel);
    continue;
  }
  const kb = Math.round(statSync(file).size / 1024);
  // Placeholder buatan scripts/make-placeholders.py selalu membawa penanda byte
  // "SLOT ASET" (komentar JPEG / teks PNG). Jadi deteksinya pasti, bukan tebakan
  // dari ukuran file — kartu share og.png yang asli juga kecil tapi bukan slot.
  const isPlaceholder = readFileSync(file).includes(Buffer.from('SLOT ASET', 'latin1'));
  (isPlaceholder ? pending : replaced).push({ rel, spec, kb });
}

const line = (icon, color, rel, spec, kb) =>
  console.log(`${color}${icon}${RESET} /${rel.replace(/^\//, '')} ${DIM}— ${spec}${kb ? `, ${kb} KB` : ''}${RESET}`);

console.log('\nAssets portfolio — status\n' + '='.repeat(52));
console.log(`\n${GREEN}Terisi file asli (${replaced.length})${RESET}`);
replaced.forEach((a) => line('✓', GREEN, a.rel, a.spec, a.kb));

console.log(`\n${RED}Masih placeholder (${pending.length})${RESET}`);
pending.forEach((a) => line('•', RED, a.rel, a.spec, a.kb));

if (missing.length) {
  console.log(`\n${DIM}File hilang (${missing.length})${RESET}`);
  missing.forEach((rel) => console.log(`  ! ${rel}`));
}

console.log(
  `\nSisa kerja: ${pending.length} dari ${Object.keys(manifest).length} slot.\n` +
    `Cara isi: timpa file placeholder dengan aset asli memakai NAMA FILE SAMA,\n` +
    `lalu jalankan "npm run build". Tidak perlu mengubah kode.\n`
);
