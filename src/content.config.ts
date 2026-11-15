import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const work = defineCollection({
  // id harus memuat folder bahasa, kalau tidak entri id & en dengan nama file
  // yang sama akan saling menimpa (id hanya diambil dari nama file).
  loader: glob({
    pattern: '**/*.{md,mdx}',
    base: './src/content/work',
    generateId: ({ entry }) => entry.replace(/\.(md|mdx)$/, '').replace(/\//g, '-'),
  }),
  schema: z.object({
    lang: z.enum(['id', 'en']),
    slug: z.string(),
    order: z.number(),
    title: z.string(),
    tagline: z.string(),
    summary: z.string(),
    role: z.string(),
    client: z.string(),
    year: z.string(),
    disciplines: z.array(z.string()),
    scope: z.array(z.string()),
    tools: z.array(z.string()),
    cover: z.string().optional(),
    video: z.string().optional(),
    featured: z.boolean().default(false),
    status: z.enum(['live', 'progress']).default('live'),
  }),
});

export const collections = { work };
