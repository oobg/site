import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireOwner: vi.fn(),
  list: vi.fn(),
  moderate: vi.fn(),
  remove: vi.fn(),
  reply: vi.fn(),
}));
vi.mock('@lib/auth/owner', async (load) => {
  const actual = await load<typeof import('@lib/auth/owner')>();
  return { ...actual, requireOwner: mocks.requireOwner };
});
vi.mock('@features/comments/services/comments.service', async (load) => ({
  ...(await load<typeof import('@features/comments/services/comments.service')>()),
  createAuthorReply: mocks.reply,
  listCommentsForOwner: mocks.list,
  setCommentModeration: mocks.moderate,
  deleteComment: mocks.remove,
}));
import {
  CommentNestedReplyError,
  CommentParentNotFoundError,
} from '@features/comments/services/comments.service';
import { OwnerAuthorizationError } from '@lib/auth/owner';
import { DELETE, GET, PATCH, POST } from '@/app/api/admin/comments/route';

describe('/api/admin/comments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireOwner.mockReset().mockResolvedValue({ authorized: true });
  });

  it('checks the owner before returning comments', async () => {
    mocks.requireOwner.mockRejectedValue(new OwnerAuthorizationError('로그인이 필요합니다.', 401));
    const response = await GET();
    expect(response.status).toBe(401);
    expect(mocks.list).not.toHaveBeenCalled();
  });

  it('lets an owner hide a comment', async () => {
    const id = crypto.randomUUID();
    mocks.moderate.mockResolvedValue({ id });
    const response = await PATCH(
      new Request('https://raven.kr/api/admin/comments', {
        method: 'PATCH',
        body: JSON.stringify({ id, status: 'hidden' }),
      }),
    );
    expect(response.status).toBe(200);
    expect(mocks.requireOwner).toHaveBeenCalledOnce();
    expect(mocks.moderate).toHaveBeenCalledWith(id, 'hidden');
  });

  it('lets an owner delete a valid comment', async () => {
    const id = crypto.randomUUID();
    const response = await DELETE(
      new Request('https://raven.kr/api/admin/comments', {
        method: 'DELETE',
        body: JSON.stringify({ id }),
      }),
    );
    expect(response.status).toBe(204);
    expect(mocks.remove).toHaveBeenCalledWith(id);
  });
});

const replyRequest = (body: unknown) =>
  new Request('https://raven.kr/api/admin/comments', {
    method: 'POST',
    body: JSON.stringify(body),
  });

describe('owner replies', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireOwner.mockReset().mockResolvedValue({ authorized: true });
    mocks.reply.mockReset();
  });
  it.each([401, 403] as const)(
    'rejects unauthorized owners (%s) before service work',
    async (status) => {
      mocks.requireOwner.mockRejectedValue(new OwnerAuthorizationError('권한이 없습니다.', status));
      const response = await POST(replyRequest({ parent_id: crypto.randomUUID(), body: '답글' }));
      expect(response.status).toBe(status);
      expect(mocks.reply).not.toHaveBeenCalled();
    },
  );
  it.each([
    { parent_id: 'bad', body: '답글' },
    { parent_id: null, body: '답글' },
    { body: ' ' },
    { body: 'a'.repeat(1001) },
    { body: 'a\u0000b' },
    { nickname: 'fake', body: '답글' },
    { is_author: true, body: '답글' },
    { post_id: crypto.randomUUID(), body: '답글' },
    { avatar_id: 'clay-01', body: '답글' },
  ])('rejects invalid or forged reply input %j', async (input) => {
    const response = await POST(replyRequest({ parent_id: crypto.randomUUID(), ...input }));
    expect(response.status).toBe(400);
    expect(mocks.reply).not.toHaveBeenCalled();
  });
  it('rejects malformed JSON', async () => {
    expect(
      (
        await POST(
          new Request('https://raven.kr/api/admin/comments', { method: 'POST', body: '{' }),
        )
      ).status,
    ).toBe(400);
    expect(mocks.reply).not.toHaveBeenCalled();
  });
  it('trims the reply and responds with a no-store author comment', async () => {
    const parent_id = crypto.randomUUID();
    const comment = {
      id: crypto.randomUUID(),
      parent_id,
      body: '답글',
      is_author: true,
      nickname: 'raven',
    };
    mocks.reply.mockResolvedValue(comment);
    const response = await POST(replyRequest({ parent_id, body: ' 답글 ' }));
    expect(response.status).toBe(201);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(mocks.reply).toHaveBeenCalledWith({ parent_id, body: '답글' });
    expect(mocks.requireOwner.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.reply.mock.invocationCallOrder[0],
    );
    await expect(response.json()).resolves.toEqual({ comment });
  });
  it.each([
    [new CommentParentNotFoundError(), 404, 'COMMENT_PARENT_NOT_FOUND'],
    [new CommentNestedReplyError(), 400, 'NESTED_REPLY_NOT_ALLOWED'],
  ])('maps invalid parent errors', async (error, status, code) => {
    mocks.reply.mockRejectedValue(error);
    const response = await POST(replyRequest({ parent_id: crypto.randomUUID(), body: '답글' }));
    expect(response.status).toBe(status);
    expect(await response.json()).toMatchObject({ error: { code } });
  });
});
