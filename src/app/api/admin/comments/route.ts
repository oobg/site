import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOwner, OwnerAuthorizationError } from '@lib/auth/owner';
import {
  deleteComment,
  listCommentsForOwner,
  setCommentModeration,
} from '@features/comments/services/comments.service';

export const runtime = 'nodejs';
const headers = { 'Cache-Control': 'no-store' };
const idSchema = z.object({ id: z.string().uuid() }).strict();
const moderationSchema = idSchema.extend({ status: z.enum(['visible', 'hidden']) }).strict();

async function authorized<T>(work: () => Promise<T>) {
  try {
    await requireOwner();
    return await work();
  } catch (error) {
    if (error instanceof OwnerAuthorizationError)
      return NextResponse.json(
        { error: { code: 'OWNER_REQUIRED', message: error.message } },
        { status: error.status, headers },
      );
    console.error('Comment moderation failed', {
      kind: error instanceof Error ? error.name : 'UnknownError',
    });
    return NextResponse.json(
      { error: { code: 'MODERATION_FAILED', message: '댓글 관리 요청을 처리하지 못했습니다.' } },
      { status: 500, headers },
    );
  }
}

export async function GET() {
  return authorized(async () =>
    NextResponse.json({ items: await listCommentsForOwner() }, { headers }),
  );
}

export async function PATCH(request: Request) {
  return authorized(async () => {
    const parsed = moderationSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success)
      return NextResponse.json(
        { error: { code: 'INVALID_REQUEST', message: '댓글 상태 요청이 올바르지 않습니다.' } },
        { status: 400, headers },
      );
    return NextResponse.json(
      { comment: await setCommentModeration(parsed.data.id, parsed.data.status) },
      { headers },
    );
  });
}

export async function DELETE(request: Request) {
  return authorized(async () => {
    const parsed = idSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success)
      return NextResponse.json(
        { error: { code: 'INVALID_REQUEST', message: '댓글 삭제 요청이 올바르지 않습니다.' } },
        { status: 400, headers },
      );
    await deleteComment(parsed.data.id);
    return new NextResponse(null, { status: 204, headers });
  });
}
