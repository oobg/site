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
    mocks.createClient.mockResolvedValue({ from: () => ({ update: () => ({ eq }) }) });
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
