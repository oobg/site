import { z } from 'zod';

const schema = z.object({
  CONTENT_API_BASE: z.string().url().default('https://api.raven.kr'),
  CONTENT_SOURCE: z.enum(['mock', 'api', 'supabase']).default('mock'),
  REVALIDATE_SECRET: z.string().default(''),
  R2_PUBLIC_URL: z.string().default(''),
});

export const env = schema.parse({
  CONTENT_API_BASE: process.env.CONTENT_API_BASE,
  CONTENT_SOURCE: process.env.CONTENT_SOURCE,
  REVALIDATE_SECRET: process.env.REVALIDATE_SECRET,
  R2_PUBLIC_URL: process.env.R2_PUBLIC_URL,
});
