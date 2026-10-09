import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const guide = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/guide' }),
  schema: z.object({
    title: z.string().min(50).max(60), description: z.string().min(150).max(160),
    question: z.string(), answer: z.string(), data_asof: z.string(),
    sources: z.array(z.string()), reviewer: z.string(), related: z.array(z.string()),
    faq: z.array(z.object({ question: z.string(), answer: z.string() })),
  }),
});
export const collections = { guide };
