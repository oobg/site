import { NextResponse } from 'next/server';
import { findBlogPost } from '@features/posts/services/posts.api';

export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
): Promise<NextResponse> {
  const { slug } = await context.params;
  if (
    !slug ||
    slug.length > 200 ||
    slug === '.' ||
    slug === '..' ||
    /[\u0000-\u001f\u007f]/.test(slug)
  ) {
    return NextResponse.json(
      { error: '글 주소가 올바르지 않습니다.' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }
  try {
    const post = await findBlogPost(slug);
    if (!post)
      return NextResponse.json(
        { error: '글을 찾을 수 없습니다.' },
        { status: 404, headers: { 'Cache-Control': 'no-store' } },
      );
    return NextResponse.json(post, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Public post detail failed', {
      kind: error instanceof Error ? error.name : 'UnknownError',
    });
    return NextResponse.json(
      { error: '공개 글을 불러오지 못했습니다.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
