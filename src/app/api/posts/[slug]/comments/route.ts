import { NextResponse } from 'next/server';
import {
  commentCursorSchema,
  commentInputSchema,
} from '@features/comments/services/comments.schema';
import {
  CommentNotFoundError,
  CommentRateLimitError,
  createComment,
  hashCommentFingerprint,
  listComments,
} from '@features/comments/services/comments.service';

export const runtime = 'nodejs';
const headers = { 'Cache-Control': 'no-store' };
const fail = (status: number, code: string, message: string, extraHeaders?: HeadersInit) =>
  NextResponse.json(
    { error: { code, message } },
    { status, headers: { ...headers, ...extraHeaders } },
  );
const validSlug = (slug: string) =>
  Boolean(slug && slug.length <= 200 && !/[\u0000-\u001f\u007f]/.test(slug));

function decodeCursor(value: string | null) {
  if (!value) return undefined;
  try {
    return commentCursorSchema.parse(JSON.parse(Buffer.from(value, 'base64url').toString('utf8')));
  } catch {
    return null;
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!validSlug(slug)) return fail(400, 'INVALID_SLUG', '글 주소가 올바르지 않습니다.');
  const cursor = decodeCursor(new URL(request.url).searchParams.get('cursor'));
  if (cursor === null) return fail(400, 'INVALID_CURSOR', '댓글 페이지 정보가 올바르지 않습니다.');
  try {
    return NextResponse.json(await listComments(slug, cursor), { headers });
  } catch (error) {
    if (error instanceof CommentNotFoundError)
      return fail(404, 'POST_NOT_FOUND', '글을 찾을 수 없습니다.');
    console.error('Comment list failed', {
      kind: error instanceof Error ? error.name : 'UnknownError',
    });
    return fail(500, 'COMMENT_LIST_FAILED', '댓글을 불러오지 못했습니다.');
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!validSlug(slug)) return fail(400, 'INVALID_SLUG', '글 주소가 올바르지 않습니다.');
  const expectedOrigin = process.env.SITE_URL?.trim().replace(/\/$/, '');
  if (!expectedOrigin || request.headers.get('origin') !== expectedOrigin)
    return fail(403, 'INVALID_ORIGIN', '허용되지 않은 요청입니다.');
  if (
    request.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase() !==
    'application/json'
  )
    return fail(415, 'UNSUPPORTED_MEDIA_TYPE', 'JSON 요청만 지원합니다.');
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return fail(400, 'INVALID_JSON', '요청 형식이 올바르지 않습니다.');
  }
  const parsed = commentInputSchema.safeParse(json);
  if (!parsed.success) return fail(400, 'INVALID_COMMENT', '닉네임과 댓글 내용을 확인해 주세요.');
  const ip =
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown';
  try {
    const fingerprint = hashCommentFingerprint(ip);
    return NextResponse.json(
      { comment: await createComment(slug, parsed.data, fingerprint) },
      { status: 201, headers },
    );
  } catch (error) {
    if (error instanceof CommentNotFoundError)
      return fail(404, 'POST_NOT_FOUND', '글을 찾을 수 없습니다.');
    if (error instanceof CommentRateLimitError)
      return fail(429, 'RATE_LIMITED', '잠시 후 다시 댓글을 남겨 주세요.', {
        'Retry-After': '600',
      });
    console.error('Comment create failed', {
      kind: error instanceof Error ? error.name : 'UnknownError',
    });
    return fail(500, 'COMMENT_CREATE_FAILED', '댓글을 등록하지 못했습니다.');
  }
}
