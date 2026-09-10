import { hydrate } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeQueryClient } from '@configs/query-client';
import { blogPostsQueryOptions } from '@features/posts/services/posts.query';

const { getBlogHomeData } = vi.hoisted(() => ({ getBlogHomeData: vi.fn() }));
vi.mock('@features/posts/services/posts.api', () => ({ getBlogHomeData }));

import { prefetchBlogHome } from '@features/posts/services/posts.prefetch';

const payload = {
  featured: [],
  categories: [],
  sections: [],
  archive: { items: [], page: 2, pageSize: 6, totalItems: 0, totalPages: 0 },
};

describe('prefetchBlogHome', () => {
  beforeEach(() => {
    getBlogHomeData.mockReset();
    getBlogHomeData.mockResolvedValue(payload);
  });

  it('direct server service 결과를 browser query의 정확한 key에 hydrate한다', async () => {
    const result = await prefetchBlogHome({ q: ' 글 ', page: 2, pageSize: 6 });
    expect(getBlogHomeData).toHaveBeenCalledWith({
      q: '글',
      category: '',
      tag: '',
      page: 2,
      pageSize: 6,
    });

    const browser = makeQueryClient();
    hydrate(browser, result.dehydratedState);
    expect(
      browser.getQueryData(blogPostsQueryOptions({ q: '글', page: 2, pageSize: 6 }).queryKey),
    ).toEqual(payload);
  });
});
