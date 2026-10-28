import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireOwner: vi.fn(),
  createClient: vi.fn(),
  invalidate: vi.fn(),
  revalidatePath: vi.fn(),
}));
vi.mock('@lib/auth/owner', () => ({
  OwnerAuthorizationError: class OwnerAuthorizationError extends Error {},
  requireOwner: mocks.requireOwner,
}));
vi.mock('@lib/supabase/server', () => ({ createClient: mocks.createClient }));
vi.mock('@lib/cache/posts', () => ({ invalidatePublicPostCache: mocks.invalidate }));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }));

import {
  createCategoryAction,
  deleteCategoryAction,
  reorderPinnedPostsAction,
  updateCategoryAction,
} from '@features/admin/services/categories.actions';

const idle = { status: 'idle' as const, message: '' };
const data = (values: Record<string, string | string[]>) => {
  const form = new FormData();
  for (const [key, value] of Object.entries(values)) {
    if (Array.isArray(value)) value.forEach((item) => form.append(key, item));
    else form.set(key, value);
  }
  return form;
};

describe('category and pin actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireOwner.mockResolvedValue(undefined);
  });

  it('입력 검증을 owner/storage보다 먼저 수행한다', async () => {
    const result = await createCategoryAction(
      idle,
      data({ name: '', slug: 'Bad Slug', sort_order: '-1' }),
    );
    expect(result.status).toBe('error');
    expect(mocks.requireOwner).not.toHaveBeenCalled();
  });

  it('category 생성 뒤 공개 cache를 즉시 무효화한다', async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    mocks.createClient.mockResolvedValue({ from: () => ({ insert }) });
    await expect(
      createCategoryAction(idle, data({ name: '개발', slug: 'engineering', sort_order: '1' })),
    ).resolves.toMatchObject({ status: 'success' });
    expect(insert).toHaveBeenCalledWith({ name: '개발', slug: 'engineering', sort_order: 1 });
    expect(mocks.invalidate).toHaveBeenCalledOnce();
  });

  it('기본 category 삭제 제약을 사용자 메시지로 바꾼다', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: { code: '23514' } });
    const select = vi.fn(() => ({ maybeSingle }));
    const eq = vi.fn(() => ({ select }));
    mocks.createClient.mockResolvedValue({ from: () => ({ delete: () => ({ eq }) }) });
    const result = await deleteCategoryAction(
      idle,
      data({ id: '00000000-0000-4000-8000-000000000001' }),
    );
    expect(result).toEqual({ status: 'error', message: '미분류 카테고리는 삭제할 수 없습니다.' });
    expect(mocks.invalidate).not.toHaveBeenCalled();
  });

  it('존재하지 않는 category 수정은 성공으로 위장하지 않는다', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const select = vi.fn(() => ({ maybeSingle }));
    const eq = vi.fn(() => ({ select }));
    mocks.createClient.mockResolvedValue({
      from: () => ({ select: () => ({ eq: () => ({ maybeSingle }) }), update: () => ({ eq }) }),
    });
    const result = await updateCategoryAction(
      idle,
      data({
        id: '10000000-0000-4000-8000-000000000001',
        name: '없음',
        slug: 'missing',
        sort_order: '1',
      }),
    );
    expect(result).toEqual({ status: 'error', message: '카테고리를 찾을 수 없습니다.' });
    expect(mocks.invalidate).not.toHaveBeenCalled();
  });

  it('대표 글 순서를 최대5개 공개 RPC 한 번으로 원자 저장한다', async () => {
    const rpc = vi.fn().mockResolvedValue({ error: null });
    mocks.createClient.mockResolvedValue({ rpc });
    const ids = Array.from({ length: 5 }, (_, i) => `00000000-0000-4000-8000-00000000000${i + 2}`);
    const result = await reorderPinnedPostsAction(idle, data({ post_ids: ids }));
    expect(result.status).toBe('success');
    expect(rpc).toHaveBeenCalledWith('set_pinned_posts', { post_ids: ids });
    expect(mocks.invalidate).toHaveBeenCalledOnce();
  });

  it('여섯 번째 pin과 중복 ID는 인증 전에 거절한다', async () => {
    const ids = Array.from({ length: 6 }, (_, i) => `00000000-0000-4000-8000-00000000001${i}`);
    expect((await reorderPinnedPostsAction(idle, data({ post_ids: ids }))).status).toBe('error');
    expect(
      (await reorderPinnedPostsAction(idle, data({ post_ids: [ids[0], ids[0]] }))).status,
    ).toBe('error');
    expect(mocks.requireOwner).not.toHaveBeenCalled();
  });
});

const categoryId = '10000000-0000-4000-8000-000000000001';
type QueryResult = { data: unknown; error: unknown };
function updateDatabase(
  current: QueryResult = { data: { id: categoryId, slug: 'dev' }, error: null },
  published: QueryResult = { data: [{ id: 'published-post' }], error: null },
  updated: QueryResult = { data: { id: categoryId }, error: null },
) {
  const read = { eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue(current) };
  const mutation = {
    eq: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(updated),
  };
  const publishedQuery = {
    eq: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(published),
  };
  const select = vi.fn(() => read);
  const update = vi.fn(() => mutation);
  const postsSelect = vi.fn(() => publishedQuery);
  const from = vi.fn((table: string) =>
    table === 'post_categories' ? { select, update } : { select: postsSelect },
  );
  mocks.createClient.mockResolvedValue({ from });
  return { read, mutation, publishedQuery, select, update, from, postsSelect };
}
const categoryForm = (slug = 'next') =>
  data({ id: categoryId, name: '새 이름', slug, sort_order: '1' });

describe('P1 published category URL protection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireOwner.mockResolvedValue(undefined);
  });
  it('조작된 slug 요청도 공개 글이 있으면 update와 캐시 무효화 전에 차단한다', async () => {
    const db = updateDatabase();
    const result = await updateCategoryAction(idle, categoryForm());
    expect(result).toEqual({
      status: 'error',
      message: '공개 글이 연결된 카테고리는 URL을 바꿀 수 없습니다. 이름만 수정해 주세요.',
    });
    expect(db.update).not.toHaveBeenCalled();
    expect(mocks.invalidate).not.toHaveBeenCalled();
    expect(db.read.eq).toHaveBeenCalledWith('id', categoryId);
    expect(db.publishedQuery.eq.mock.calls).toEqual([
      ['category_id', categoryId],
      ['status', 'published'],
    ]);
    expect(db.publishedQuery.limit).toHaveBeenCalledWith(1);
    expect(mocks.requireOwner.mock.invocationCallOrder[0]).toBeLessThan(
      db.from.mock.invocationCallOrder[0]!,
    );
    expect(db.read.maybeSingle.mock.invocationCallOrder[0]).toBeLessThan(
      db.postsSelect.mock.invocationCallOrder[0]!,
    );
  });
  it('이름만 바꾸면 공개 글 조회 없이 slug를 payload에서 제외하고 저장한다', async () => {
    const db = updateDatabase();
    expect((await updateCategoryAction(idle, categoryForm('dev'))).status).toBe('success');
    expect(db.from).not.toHaveBeenCalledWith('posts');
    expect(db.update).toHaveBeenCalledWith({ name: '새 이름', sort_order: 1 });
    expect(mocks.invalidate).toHaveBeenCalledOnce();
  });
  it('공개 글이 없으면 기존 slug 조건으로 URL 변경을 허용한다', async () => {
    const db = updateDatabase(undefined, { data: [], error: null });
    expect((await updateCategoryAction(idle, categoryForm())).status).toBe('success');
    expect(db.update).toHaveBeenCalledWith({ slug: 'next', name: '새 이름', sort_order: 1 });
    expect(db.mutation.eq).toHaveBeenCalledWith('id', categoryId);
    expect(db.mutation.eq).toHaveBeenCalledWith('slug', 'dev');
    expect(db.publishedQuery.limit.mock.invocationCallOrder[0]).toBeLessThan(
      db.update.mock.invocationCallOrder[0]!,
    );
  });
  it.each([
    { data: null, error: new Error('lookup failed') },
    { data: null, error: null },
    { data: {}, error: null },
  ])('공개 여부 조회 오류/판별 불가는 수정하지 않는다', async (published) => {
    const db = updateDatabase(undefined, published);
    expect((await updateCategoryAction(idle, categoryForm())).status).toBe('error');
    expect(db.update).not.toHaveBeenCalled();
    expect(mocks.invalidate).not.toHaveBeenCalled();
  });
  it.each([
    { data: null, error: new Error('category lookup failed') },
    { data: null, error: null },
    { data: { id: categoryId, slug: null }, error: null },
  ])('현재 카테고리 오류/미존재/판별 불가는 수정하지 않는다', async (current) => {
    const db = updateDatabase(current);
    expect((await updateCategoryAction(idle, categoryForm())).status).toBe('error');
    expect(db.update).not.toHaveBeenCalled();
    expect(db.postsSelect).not.toHaveBeenCalled();
    expect(mocks.invalidate).not.toHaveBeenCalled();
  });
  it('인증 실패는 DB 조회 전에 반환한다', async () => {
    const db = updateDatabase();
    mocks.requireOwner.mockRejectedValueOnce(new Error('not owner'));
    expect((await updateCategoryAction(idle, categoryForm())).status).toBe('error');
    expect(db.from).not.toHaveBeenCalled();
    expect(mocks.invalidate).not.toHaveBeenCalled();
  });
  it('읽은 뒤 삭제/다른 URL로 변경되어 갱신 0행이면 성공과 캐시 무효화를 반환하지 않는다', async () => {
    const db = updateDatabase(undefined, { data: [], error: null }, { data: null, error: null });
    expect((await updateCategoryAction(idle, categoryForm())).status).toBe('error');
    expect(db.mutation.eq).toHaveBeenCalledWith('slug', 'dev');
    expect(mocks.invalidate).not.toHaveBeenCalled();
  });
});
