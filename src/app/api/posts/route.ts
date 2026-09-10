import { NextResponse } from 'next/server';
import { getBlogHomeData } from '@features/posts/services/posts.api';
import { blogPostFiltersSchema } from '@features/posts/utils/blog-schema';

export const runtime = 'nodejs';

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const parsed = blogPostFiltersSchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return NextResponse.json(
      { error: '검색 조건이 올바르지 않습니다.' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  try {
    const data = await getBlogHomeData(parsed.data);
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Public posts query failed', {
      kind: error instanceof Error ? error.name : 'UnknownError',
    });
    return NextResponse.json(
      { error: '공개 글을 불러오지 못했습니다.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
