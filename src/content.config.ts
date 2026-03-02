import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const patents = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/patents" }),
  schema: z.object({
    title: z.string(),
    number: z.string(),
    type: z.enum(['grant', 'pending']),
    filed: z.string(),
    granted: z.string().optional(),
    published: z.string().optional(),
    assignee: z.string(),
    inventors: z.array(z.string()),
    topic: z.string(),
    topicLabel: z.string(),
  }),
});

const insights = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/insights" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.string(),
    tags: z.array(z.string()).optional(),
    draft: z.boolean().optional(),
  }),
});

export const collections = { patents, insights };
