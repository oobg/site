import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { z } from 'zod';
import { env } from '@configs/env';

const MAX_BODY_SIZE = 64 * 1024;
const payloadSchema = z.object({
  changed: z
    .array(
      z.object({
        type: z.enum(['post', 'project']),
        slug: z
          .string()
          .min(1)
          .max(200)
          .refine((slug) => slug.trim().length > 0 && !/[\u0000-\u001f\u007f]/.test(slug)),
      }),
    )
    .max(100)
    .default([]),
});

export async function POST(req: Request): Promise<NextResponse> {
  const secret = req.headers.get('x-revalidate-secret');
  if (!env.REVALIDATE_SECRET || secret !== env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const declaredLength = Number(req.headers.get('content-length'));
    if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_SIZE) {
      return NextResponse.json({ error: 'payload too large' }, { status: 413 });
    }

    const raw = await req.text();
    if (raw.length > MAX_BODY_SIZE) {
      return NextResponse.json({ error: 'payload too large' }, { status: 413 });
    }

    let input: unknown;
    try {
      input = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: 'invalid payload' }, { status: 400 });
    }
    const parsed = payloadSchema.safeParse(input);
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid payload' }, { status: 400 });
    }
    const changed = parsed.data.changed;

    if (changed.length === 0) {
      revalidateTag('posts', { expire: 0 });
      revalidateTag('post-categories', { expire: 0 });
      revalidateTag('projects', { expire: 0 });
      return NextResponse.json({ revalidated: true, count: 0 });
    }

    const listTags = new Set<string>();
    for (const item of changed) {
      revalidateTag(`${item.type}:${item.slug}`, { expire: 0 });
      listTags.add(item.type === 'post' ? 'posts' : 'projects');
    }
    for (const tag of listTags) {
      revalidateTag(tag, { expire: 0 });
      if (tag === 'posts') revalidateTag('post-categories', { expire: 0 });
    }

    return NextResponse.json({ revalidated: true, count: changed.length });
  } catch (error) {
    console.error('Cache revalidation failed', {
      kind: error instanceof Error ? error.name : 'UnknownError',
    });
    return NextResponse.json({ error: 'revalidation failed' }, { status: 500 });
  }
}
