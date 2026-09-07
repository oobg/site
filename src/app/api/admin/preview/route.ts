import { NextResponse } from 'next/server';

import { OwnerAuthorizationError, requireOwner } from '@lib/auth/owner';
import { renderMarkdown } from '@lib/markdown/render';

export const runtime = 'nodejs';

const MAX_MARKDOWN_LENGTH = 200_000;

export async function POST(request: Request) {
  try {
    const origin = request.headers.get('origin');
    const expectedOrigin = process.env.SITE_URL?.replace(/\/$/, '') ?? new URL(request.url).origin;
    if (!origin || origin !== expectedOrigin) {
      return NextResponse.json({ error: '허용되지 않은 요청 출처입니다.' }, { status: 403 });
    }

    await requireOwner();
    const raw = await request.text();
    if (raw.length > 1_000_000) {
      return NextResponse.json({ error: '본문이 너무 깁니다.' }, { status: 413 });
    }
    const payload: unknown = JSON.parse(raw);
    if (
      typeof payload !== 'object' ||
      payload === null ||
      !('markdown' in payload) ||
      typeof payload.markdown !== 'string'
    ) {
      return NextResponse.json({ error: 'Markdown 본문이 필요합니다.' }, { status: 400 });
    }
    if (payload.markdown.length > MAX_MARKDOWN_LENGTH) {
      return NextResponse.json({ error: '본문이 너무 깁니다.' }, { status: 413 });
    }

    const { html } = await renderMarkdown(payload.markdown);
    return NextResponse.json({ html }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof OwnerAuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: '요청 형식이 올바르지 않습니다.' }, { status: 400 });
    }
    console.error('Markdown preview failed', error);
    return NextResponse.json({ error: '미리보기를 만들지 못했습니다.' }, { status: 500 });
  }
}
