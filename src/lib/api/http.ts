import 'server-only';
import { notFound } from 'next/navigation';
import { env } from '@configs/env';
import type { Envelope } from '@lib/api/contract.types';

export interface ApiGetOptions {
  tags?: string[];
  revalidate?: number;
  searchParams?: Record<string, string | number | undefined>;
}

export async function apiGet<T>(path: string, options: ApiGetOptions = {}): Promise<T> {
  const url = new URL(path, env.CONTENT_API_BASE);
  if (options.searchParams) {
    for (const [key, value] of Object.entries(options.searchParams)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }
  const res = await fetch(url, {
    next: { tags: options.tags, revalidate: options.revalidate ?? 3600 },
  });
  if (res.status === 404) notFound();
  if (!res.ok) throw new Error(`content api ${res.status} for ${path}`);
  const json = (await res.json()) as Envelope<T>;
  return json.data;
}
