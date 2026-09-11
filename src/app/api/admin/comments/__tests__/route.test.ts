import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireOwner: vi.fn(),
  list: vi.fn(),
  moderate: vi.fn(),
  remove: vi.fn(),
}));
vi.mock('@lib/auth/owner', async (load) => {
  const actual = await load<typeof import('@lib/auth/owner')>();
  return { ...actual, requireOwner: mocks.requireOwner };
});
vi.mock('@features/comments/services/comments.service', () => ({
  listCommentsForOwner: mocks.list,
  setCommentModeration: mocks.moderate,
  deleteComment: mocks.remove,
}));
import { OwnerAuthorizationError } from '@lib/auth/owner';
import { DELETE, GET, PATCH } from '@/app/api/admin/comments/route';

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
