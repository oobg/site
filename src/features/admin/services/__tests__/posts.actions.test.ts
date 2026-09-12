import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireOwner: vi.fn(),
  createClient: vi.fn(),
  revalidatePath: vi.fn(),
  invalidatePublicPostCache: vi.fn(),
}));

vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock('@lib/auth/owner', () => ({
  OwnerAuthorizationError: class OwnerAuthorizationError extends Error {
    constructor(
      message: string,
      public readonly status: number,
    ) {
      super(message);
    }
  },
  requireOwner: mocks.requireOwner,
}));
vi.mock('@lib/supabase/server', () => ({ createClient: mocks.createClient }));
vi.mock('@lib/cache/posts', () => ({ invalidatePublicPostCache: mocks.invalidatePublicPostCache }));
vi.mock('@lib/cache/posts', () => ({
  invalidatePublicPostCache: mocks.invalidatePublicPostCache,
}));

import {
  createPostAction,
  deletePostAction,
  updatePostAction,
} from '@features/admin/services/posts.actions';
import { OwnerAuthorizationError } from '@lib/auth/owner';

const previous = { status: 'idle' as const, message: '' };
const form = (overrides: Record<string, string> = {}) => {
  const values = {
    title: '제목',
    slug: 'post-slug',
    description: '설명',
    body: '본문',
    status: 'draft',
    ...overrides,
  };
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
};

describe('post actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireOwner.mockResolvedValue(undefined);
  });

  it('validates input before touching authentication or storage', async () => {
    const result = await createPostAction(previous, form({ slug: '../invalid' }));

    expect(result.status).toBe('error');
    expect(mocks.requireOwner).not.toHaveBeenCalled();
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it('creates a draft without a publication timestamp', async () => {
    const single = vi.fn().mockResolvedValue({ data: { id: 'post-id' }, error: null });
    const select = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select });
    mocks.createClient.mockResolvedValue({ from: vi.fn().mockReturnValue({ insert }) });

    const result = await createPostAction(previous, form());

    expect(result).toMatchObject({ status: 'success', postId: 'post-id' });
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ published_at: null }));
    expect(mocks.invalidatePublicPostCache).toHaveBeenCalledWith({ newSlug: 'post-slug' });
  });

  it('sets a publication timestamp only for a published post', async () => {
    const single = vi.fn().mockResolvedValue({ data: { id: 'post-id' }, error: null });
    const insert = vi.fn().mockReturnValue({ select: () => ({ single }) });
    mocks.createClient.mockResolvedValue({ from: vi.fn().mockReturnValue({ insert }) });

    await createPostAction(previous, form({ status: 'published' }));

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ published_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/) }),
    );
  });

  it('keeps a successful create result and continues refreshing when one path fails', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mocks.revalidatePath.mockImplementationOnce(() => {
      throw new Error('cache unavailable');
    });
    const single = vi.fn().mockResolvedValue({ data: { id: 'post-id' }, error: null });
    const insert = vi.fn().mockReturnValue({ select: () => ({ single }) });
    mocks.createClient.mockResolvedValue({ from: vi.fn().mockReturnValue({ insert }) });

    await expect(createPostAction(previous, form())).resolves.toMatchObject({
      status: 'success',
      postId: 'post-id',
    });
    expect(mocks.revalidatePath.mock.calls.map(([path]) => path)).toEqual([
      '/',
      '/blog',
      '/admin',
      '/blog/post-slug',
    ]);
    expect(log).toHaveBeenCalledWith('Post cache revalidation failed');
    log.mockRestore();
  });

  it('returns a safe message when storage fails', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mocks.createClient.mockRejectedValue(new Error('database secret detail'));

    await expect(createPostAction(previous, form())).resolves.toEqual({
      status: 'error',
      message: '요청을 처리하지 못했습니다.',
    });
    log.mockRestore();
  });

  it.each([
    [new OwnerAuthorizationError('로그인이 필요합니다.', 401), '로그인이 필요합니다.'],
    [new OwnerAuthorizationError('관리자 권한이 없습니다.', 403), '관리자 권한이 없습니다.'],
  ])('preserves authorization failures without touching storage', async (error, message) => {
    mocks.requireOwner.mockRejectedValue(error);

    await expect(createPostAction(previous, form())).resolves.toEqual({ status: 'error', message });
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it('returns a field error for duplicate slugs', async () => {
    const single = vi.fn().mockResolvedValue({ data: null, error: { code: '23505' } });
    const insert = vi.fn().mockReturnValue({ select: () => ({ single }) });
    mocks.createClient.mockResolvedValue({ from: vi.fn().mockReturnValue({ insert }) });

    await expect(createPostAction(previous, form())).resolves.toMatchObject({
      status: 'error',
      fieldErrors: { slug: ['이미 사용 중인 슬러그입니다.'] },
    });
  });

  it.each([
    ['draft', '2026-09-01T00:00:00.000Z', null],
    ['published', null, expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/)],
  ])(
    'updates publication state to %s with the correct timestamp',
    async (status, currentPublishedAt, expected) => {
      const readSingle = vi.fn().mockResolvedValue({
        data: {
          slug: 'old-slug',
          status: status === 'draft' ? 'published' : 'draft',
          published_at: currentPublishedAt,
        },
        error: null,
      });
      const updateEq = vi.fn().mockResolvedValue({ error: null });
      const update = vi.fn().mockReturnValue({ eq: updateEq });
      const table = {
        select: vi.fn().mockReturnValue({ eq: () => ({ single: readSingle }) }),
        update,
      };
      mocks.createClient.mockResolvedValue({ from: vi.fn().mockReturnValue(table) });
      const data = form({ status, slug: 'new-slug' });
      data.set('id', '8e10a748-fd28-41a0-9f3d-8b81fc40c753');

      const result = await updatePostAction(previous, data);

      expect(result.status).toBe('success');
      expect(update).toHaveBeenCalledWith(expect.objectContaining({ published_at: expected }));
      expect(mocks.revalidatePath).toHaveBeenCalledWith('/blog/old-slug');
      expect(mocks.revalidatePath).toHaveBeenCalledWith('/blog/new-slug');
      expect(mocks.invalidatePublicPostCache).toHaveBeenCalledWith({
        oldSlug: 'old-slug',
        newSlug: 'new-slug',
      });
    },
  );

  it('deletes the authorized post and refreshes its old slug', async () => {
    const single = vi.fn().mockResolvedValue({ data: { slug: 'deleted-post' }, error: null });
    const remove = vi.fn().mockReturnValue({ eq: () => ({ select: () => ({ single }) }) });
    mocks.createClient.mockResolvedValue({ from: vi.fn().mockReturnValue({ delete: remove }) });
    const data = new FormData();
    data.set('id', '8e10a748-fd28-41a0-9f3d-8b81fc40c753');

    await expect(deletePostAction(previous, data)).resolves.toMatchObject({ status: 'success' });
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/blog/deleted-post');
  });

  it('deduplicates update paths and keeps success when cache revalidation fails', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mocks.revalidatePath.mockImplementationOnce(() => {
      throw new Error('cache unavailable');
    });
    const readSingle = vi.fn().mockResolvedValue({
      data: { slug: 'post-slug', status: 'draft', published_at: null },
      error: null,
    });
    const update = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    const table = {
      select: vi.fn().mockReturnValue({ eq: () => ({ single: readSingle }) }),
      update,
    };
    mocks.createClient.mockResolvedValue({ from: vi.fn().mockReturnValue(table) });
    const data = form();
    data.set('id', '8e10a748-fd28-41a0-9f3d-8b81fc40c753');

    await expect(updatePostAction(previous, data)).resolves.toMatchObject({ status: 'success' });
    expect(mocks.revalidatePath.mock.calls.map(([path]) => path)).toEqual([
      '/',
      '/blog',
      '/admin',
      '/blog/post-slug',
    ]);
    log.mockRestore();
  });

  it('keeps a successful delete result when cache revalidation fails', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mocks.revalidatePath.mockImplementationOnce(() => {
      throw new Error('cache unavailable');
    });
    const single = vi.fn().mockResolvedValue({ data: { slug: 'deleted-post' }, error: null });
    const remove = vi.fn().mockReturnValue({ eq: () => ({ select: () => ({ single }) }) });
    mocks.createClient.mockResolvedValue({ from: vi.fn().mockReturnValue({ delete: remove }) });
    const data = new FormData();
    data.set('id', '8e10a748-fd28-41a0-9f3d-8b81fc40c753');

    await expect(deletePostAction(previous, data)).resolves.toMatchObject({ status: 'success' });
    expect(mocks.revalidatePath).toHaveBeenCalledTimes(4);
    log.mockRestore();
  });

  it.each(['update', 'delete'] as const)(
    '%s rejects invalid IDs before authentication and storage',
    async (operation) => {
      const data = operation === 'update' ? form() : new FormData();
      data.set('id', 'invalid');
      const result =
        operation === 'update'
          ? await updatePostAction(previous, data)
          : await deletePostAction(previous, data);
      expect(result.status).toBe('error');
      expect(mocks.requireOwner).not.toHaveBeenCalled();
      expect(mocks.createClient).not.toHaveBeenCalled();
    },
  );

  it.each([
    ['update', 401, '로그인이 필요합니다.'],
    ['update', 403, '관리자 권한이 없습니다.'],
    ['delete', 401, '로그인이 필요합니다.'],
    ['delete', 403, '관리자 권한이 없습니다.'],
  ] as const)(
    '%s preserves %s authorization failures without storage access',
    async (operation, status, message) => {
      mocks.requireOwner.mockRejectedValue(new OwnerAuthorizationError(message, status));
      const data = operation === 'update' ? form() : new FormData();
      data.set('id', '8e10a748-fd28-41a0-9f3d-8b81fc40c753');
      const result =
        operation === 'update'
          ? await updatePostAction(previous, data)
          : await deletePostAction(previous, data);
      expect(result).toEqual({ status: 'error', message });
      expect(mocks.createClient).not.toHaveBeenCalled();
    },
  );
});
