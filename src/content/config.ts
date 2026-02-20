import { defineCollection, z } from 'astro:content';

const outils = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    url: z.string().optional(),
    icon: z.string().optional(),
  }),
});

const activites = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    image: z.string().optional(),
    icon: z.string().optional(),
    baseline: z.string().optional(),
    objectifs: z.array(z.string()).optional(),
    category: z.string().optional(),
    templates: z.array(z.union([z.string(), z.object({ name: z.string(), url: z.string() })])).optional(),
    outils: z.array(z.union([z.string(), z.object({ name: z.string(), url: z.string().optional(), icon: z.string().optional() })])).optional(),
    exemples: z.array(z.string()).optional(),
  }),
});

export const collections = {
  outils,
  activites,
};
