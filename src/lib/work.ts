import fs from 'node:fs';
import path from 'node:path';
import { getCollection } from 'astro:content';
import type { Lang } from '../i18n/ui';

export type Project = Awaited<ReturnType<typeof getWork>>[number];

export async function getWork(lang: Lang) {
  const entries = await getCollection('work', ({ data }) => data.lang === lang);
  return entries.sort((a, b) => a.data.order - b.data.order);
}

export async function getFeatured(lang: Lang, limit = 6) {
  const all = await getWork(lang);
  return all.filter((p) => p.data.featured).slice(0, limit);
}

export async function getProject(lang: Lang, slug: string) {
  const all = await getWork(lang);
  return all.find((p) => p.data.slug === slug);
}

export async function getNeighbour(lang: Lang, slug: string) {
  const all = await getWork(lang);
  const i = all.findIndex((p) => p.data.slug === slug);
  if (i === -1 || all.length < 2) return undefined;
  return all[(i + 1) % all.length];
}

/** does a public asset already exist on disk? */
export function assetExists(src: string): boolean {
  const clean = src.startsWith('/') ? src.slice(1) : src;
  return fs.existsSync(path.join(process.cwd(), 'public', clean));
}
