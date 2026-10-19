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
    expectedUpdatedAt: '2026-09-01T00:00:00.000Z',
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
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/blog/[category]/[slug]', 'page');
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
      '/blog/[category]/[slug]',
      '/blog/post-slug',
    ]);
    expect(log).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: 'post_path_revalidation',
        code: 'CACHE_REVALIDATION_FAILED',
        level: 'error',
      }),
    );
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
      const updateEq = vi.fn();
      updateEq.mockReturnValue({
        eq: updateEq,
        select: () => ({
          maybeSingle: async () => ({
            data: { updated_at: '2026-09-02T00:00:00.000Z' },
            error: null,
          }),
        }),
      });
      const update = vi.fn().mockReturnValue({ eq: updateEq });
      const table = {
        select: vi.fn().mockReturnValue({ eq: () => ({ maybeSingle: readSingle }) }),
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
      expect(mocks.revalidatePath).toHaveBeenCalledWith('/blog/[category]/[slug]', 'page');
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
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/blog/[category]/[slug]', 'page');
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
    const eq = vi.fn();
    eq.mockReturnValue({
      eq,
      select: () => ({
        maybeSingle: async () => ({
          data: { updated_at: '2026-09-02T00:00:00.000Z' },
          error: null,
        }),
      }),
    });
    const update = vi.fn().mockReturnValue({ eq });
    const table = {
      select: vi.fn().mockReturnValue({ eq: () => ({ maybeSingle: readSingle }) }),
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
      '/blog/[category]/[slug]',
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
    expect(mocks.revalidatePath).toHaveBeenCalledTimes(5);
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

describe('editor optimistic concurrency', () => {
  const id = '8e10a748-fd28-41a0-9f3d-8b81fc40c753';
  const baseRevision = '2026-09-01T00:00:00.000Z';
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireOwner.mockResolvedValue(undefined);
  });
  function backend(options: { current?: boolean; revision?: string; writeError?: unknown } = {}) {
    let revision = options.revision ?? baseRevision;
    const writes: Array<{ filters: Record<string, unknown>; values: Record<string, unknown> }> = [];
    const update = vi.fn((values: Record<string, unknown>) => {
      const filters: Record<string, unknown> = {};
      const query = {
        eq: vi.fn((key: string, value: unknown) => {
          filters[key] = value;
          return query;
        }),
        select: vi.fn(() => query),
        maybeSingle: vi.fn(async () => {
          if (options.writeError) return { data: null, error: options.writeError };
          if (filters.id !== id || filters.updated_at !== revision)
            return { data: null, error: null };
          writes.push({ filters: { ...filters }, values });
          // Represents the DB's authoritative updated_at returned after its update trigger.
          revision = new Date(Date.parse(revision) + 1000).toISOString();
          return { data: { updated_at: revision }, error: null };
        }),
      };
      return query;
    });
    const table = {
      select: vi.fn(() => ({
        eq: () => ({
          maybeSingle: async () => ({
            data:
              options.current === false
                ? null
                : { slug: 'old', status: 'draft', published_at: null },
            error: null,
          }),
        }),
      })),
      update,
    };
    mocks.createClient.mockResolvedValue({ from: vi.fn(() => table) });
    return { writes, update };
  }
  it('requires the original revision and returns the DB revision for two successive saves', async () => {
    const db = backend();
    const first = await updatePostAction(previous, form({ id, expectedUpdatedAt: baseRevision }));
    expect(first).toMatchObject({ status: 'success', updatedAt: '2026-09-01T00:00:01.000Z' });
    const second = await updatePostAction(
      previous,
      form({ id, expectedUpdatedAt: first.updatedAt!, body: '두 번째 저장' }),
    );
    expect(second).toMatchObject({ status: 'success', updatedAt: '2026-09-01T00:00:02.000Z' });
    expect(db.writes.map((w) => w.filters)).toEqual([
      { id, updated_at: baseRevision },
      { id, updated_at: first.updatedAt },
    ]);
  });
  it.each(['another tab edit', 'concurrent publication state change'])(
    'does not overwrite after %s',
    async () => {
      const db = backend({ revision: '2026-09-01T00:00:03.123456Z' });
      const result = await updatePostAction(
        previous,
        form({ id, expectedUpdatedAt: baseRevision, body: '오래된 내용' }),
      );
      expect(result.status).toBe('error');
      expect(result.fieldErrors?.expectedUpdatedAt).toBeDefined();
      expect(db.writes).toHaveLength(0);
      expect(db.update).toHaveBeenCalledOnce();
      expect(mocks.invalidatePublicPostCache).not.toHaveBeenCalled();
    },
  );
  it('returns conflict for a deleted post without issuing an update', async () => {
    const db = backend({ current: false });
    const result = await updatePostAction(previous, form({ id, expectedUpdatedAt: baseRevision }));
    expect(result.fieldErrors?.expectedUpdatedAt).toBeDefined();
    expect(db.update).not.toHaveBeenCalled();
  });
  it('rejects a missing revision instead of silently accepting current data', async () => {
    const db = backend();
    const data = form({ id });
    data.delete('expectedUpdatedAt');
    const result = await updatePostAction(previous, data);
    expect(result.fieldErrors?.expectedUpdatedAt).toBeDefined();
    expect(db.update).not.toHaveBeenCalled();
    expect(mocks.createClient).not.toHaveBeenCalled();
  });
  it('does not report success or invalidate cache after a network/storage failure', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    backend({ writeError: new Error('offline') });
    const result = await updatePostAction(previous, form({ id }));
    expect(result.status).toBe('error');
    expect(mocks.invalidatePublicPostCache).not.toHaveBeenCalled();
    log.mockRestore();
  });
});
