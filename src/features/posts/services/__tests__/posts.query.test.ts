import { QueryClient, dehydrate, hydrate } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { makeQueryClient } from '@configs/query-client';
import {
  blogPostsQueryKey,
  blogPostsQueryOptions,
  normalizeBlogPostFilters,
} from '@features/posts/services/posts.query';

const payload = {
  featured: [],
  categories: [],
  sections: [],
  archive: { items: [], page: 1, pageSize: 12, totalItems: 0, totalPages: 0 },
};

describe('blog posts query contract', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('동등한 필터를 같은 primitive query key로 정규화한다', () => {
    expect(blogPostsQueryKey({ q: ' 글 ', category: 'DEV', tag: 'React', page: 1 })).toEqual(
      blogPostsQueryKey({ q: '글', category: 'dev', tag: 'react', page: 1, pageSize: 12 }),
    );
    expect(normalizeBlogPostFilters({ page: Number.NaN, pageSize: 500 })).toMatchObject({
      page: 1,
      pageSize: 100,
    });
  });

  it('브라우저 transport는 공개 route와 no-store를 사용한다', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await new QueryClient().fetchQuery(blogPostsQueryOptions({ q: 'RSC', page: 2, pageSize: 6 }));

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/posts?q=RSC&page=2&pageSize=6',
      expect.objectContaining({ cache: 'no-store', signal: expect.any(AbortSignal) }),
    );
  });

  it('60초 내 hydrate된 query는 첫 소비에서 다시 요청하지 않는다', async () => {
    const server = makeQueryClient();
    const options = blogPostsQueryOptions();
    server.setQueryData(options.queryKey, payload);

    const browser = makeQueryClient();
    hydrate(browser, dehydrate(server));
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(browser.fetchQuery(options)).resolves.toEqual(payload);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(browser.getDefaultOptions().queries).toMatchObject({
      staleTime: 60_000,
      gcTime: 300_000,
    });
  });
});
