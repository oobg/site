import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('posts.api', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('mock 소스에서 글 목록을 반환한다', async () => {
    vi.stubEnv('CONTENT_SOURCE', 'mock');
    const { getPosts } = await import('@features/posts/services/posts.api');
    const posts = await getPosts();
    expect(posts).toHaveLength(1);
    expect(posts[0].slug).toBe('hexagonal-nestjs');
  });

  it('api 소스에서 envelope의 data를 언랩한다', async () => {
    vi.stubEnv('CONTENT_SOURCE', 'api');
    vi.stubEnv('CONTENT_API_BASE', 'https://api.raven.kr');
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: [
            {
              slug: 's',
              title: 't',
              summary: '',
              tags: [],
              published_at: '',
              updated_at: '',
              cover_image_url: null,
              status: 'published',
            },
          ],
          meta: { requestId: '1', serverTime: '', pagination: { total: 1, page: 1, limit: 20 } },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    const { getPosts } = await import('@features/posts/services/posts.api');
    const posts = await getPosts({ tag: 'nestjs' });
    expect(posts[0].slug).toBe('s');
    const calledUrl = fetchMock.mock.calls[0][0] as URL;
    expect(calledUrl.pathname).toBe('/content/posts');
    expect(calledUrl.searchParams.get('tag')).toBe('nestjs');
  });
});
