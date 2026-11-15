/**
 * Menghasilkan dist/sitemap.xml setelah build.
 * Tanpa dependency: membaca daftar halaman dari dist/, lalu memasangkan
 * setiap halaman ID dengan pasangannya di /en/ lewat <link rel="alternate" hreflang>.
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const DIST = 'dist';
const SITE = (readFileSync('astro.config.mjs', 'utf8').match(/site:\s*['"]([^'"]+)['"]/)?.[1] || 'https://dandie.pages.dev').replace(/\/$/, '');

/** semua file .html di dist, kecuali 404 */
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (name.endsWith('.html') && name !== '404.html') out.push(p);
  }
  return out;
}

const files = walk(DIST);

const urls = files.map((file) => {
  const rel = relative(DIST, file).replace(/\\/g, '/');
  const path = rel === 'index.html' ? '/' : '/' + rel.replace(/index\.html$/, '').replace(/\.html$/, '');
  const html = readFileSync(file, 'utf8');
  const alts = {};
  for (const m of html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)) {
    alts[m[1]] = m[2];
  }
  const lastmod = statSync(file).mtime.toISOString().slice(0, 10);
  return { loc: SITE + path, lastmod, alts };
});

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls
  .map(
    (u) => `  <url>
    <loc>${esc(u.loc)}</loc>
    <lastmod>${u.lastmod}</lastmod>
${Object.entries(u.alts)
  .map(([lang, href]) => `    <xhtml:link rel="alternate" hreflang="${lang}" href="${esc(href)}"/>`)
  .join('\n')}
  </url>`
  )
  .join('\n')}
</urlset>
`;

writeFileSync(join(DIST, 'sitemap.xml'), xml, 'utf8');
console.log(`sitemap.xml — ${urls.length} URL`);
