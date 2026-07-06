import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { env } from '@configs/env';

interface Changed {
  type: 'post' | 'project';
  slug: string;
}

export async function POST(req: Request): Promise<NextResponse> {
  const secret = req.headers.get('x-revalidate-secret');
  if (!env.REVALIDATE_SECRET || secret !== env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { changed?: Changed[] };
  const changed = body.changed ?? [];

  if (changed.length === 0) {
    // {} 는 기본 cache-life 설정이며, Next 16에서 on-demand 퍼지 시 두 번째 인자가 필수다.
    revalidateTag('posts', {});
    revalidateTag('projects', {});
    return NextResponse.json({ revalidated: true, count: 0 });
  }

  const listTags = new Set<string>();
  for (const item of changed) {
    // {} 는 기본 cache-life 설정이며, Next 16에서 on-demand 퍼지 시 두 번째 인자가 필수다.
    revalidateTag(`${item.type}:${item.slug}`, {});
    listTags.add(item.type === 'post' ? 'posts' : 'projects');
  }
  for (const tag of listTags) revalidateTag(tag, {});

  return NextResponse.json({ revalidated: true, count: changed.length });
}
