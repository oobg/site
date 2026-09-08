import { z } from 'zod';

const schema = z.object({
  CONTENT_API_BASE: z.string().url().default('https://api.raven.kr'),
  CONTENT_SOURCE: z.enum(['mock', 'api', 'supabase']).default('mock'),
  REVALIDATE_SECRET: z.string().default(''),
  R2_PUBLIC_URL: z.string().default(''),
  ASSET_STORAGE_BACKEND: z.enum(['r2', 'local']).default('r2'),
  ASSET_PUBLIC_URL: z.string().default(''),
});

export const env = schema.parse({
  CONTENT_API_BASE: process.env.CONTENT_API_BASE,
  CONTENT_SOURCE: process.env.CONTENT_SOURCE,
  REVALIDATE_SECRET: process.env.REVALIDATE_SECRET,
  R2_PUBLIC_URL: process.env.R2_PUBLIC_URL,
  ASSET_STORAGE_BACKEND: process.env.ASSET_STORAGE_BACKEND,
  ASSET_PUBLIC_URL: process.env.ASSET_PUBLIC_URL,
});
