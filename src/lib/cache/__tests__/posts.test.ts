import { beforeEach, describe, expect, it, vi } from 'vitest';

const { revalidateTag } = vi.hoisted(() => ({ revalidateTag: vi.fn() }));
vi.mock('next/cache', () => ({ revalidateTag }));

import { invalidatePublicPostCache } from '@lib/cache/posts';

describe('invalidatePublicPostCache', () => {
  beforeEach(() => revalidateTag.mockClear());

  it('목록·카테고리와 old/new 상세를 expire:0으로 즉시 무효화한다', () => {
    invalidatePublicPostCache({ oldSlug: 'old', newSlug: 'new' });
    expect(revalidateTag.mock.calls).toEqual([
      ['posts', { expire: 0 }],
      ['post-categories', { expire: 0 }],
      ['post:old', { expire: 0 }],
      ['post:new', { expire: 0 }],
    ]);
  });

  it('slug가 같으면 상세 태그를 중복 무효화하지 않는다', () => {
    invalidatePublicPostCache({ oldSlug: '같은-글', newSlug: '같은-글' });
    expect(revalidateTag).toHaveBeenCalledTimes(3);
  });
});
