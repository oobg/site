import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('next/cache', () => ({
  unstable_cache:
    <TArgs extends unknown[], TResult>(fn: (...args: TArgs) => TResult) =>
    (...args: TArgs) =>
      fn(...args),
}));

describe('posts.api', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.doUnmock('@lib/supabase/public');
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('mock 소스에서 글 목록을 반환한다', async () => {
    vi.stubEnv('CONTENT_SOURCE', 'mock');
    const { getPosts } = await import('@features/posts/services/posts.api');
    const posts = await getPosts();
    expect(posts).toHaveLength(2);
    // 기본 정렬은 -published_at(최신순) → rsc-우선-데이터-패칭(2026-07-03)이 첫 번째
    expect(posts[0].slug).toBe('rsc-우선-데이터-패칭');
  });

  it("mock: getPosts({ sort: '-published_at' })는 최신순으로 반환한다", async () => {
    vi.stubEnv('CONTENT_SOURCE', 'mock');
    const { getPosts } = await import('@features/posts/services/posts.api');
    const posts = await getPosts({ sort: '-published_at' });
    // rsc-우선-데이터-패칭 (2026-07-03) before 가벼운-헥사고날로-nestjs-나누기 (2026-06-24)
    expect(posts[0].slug).toBe('rsc-우선-데이터-패칭');
    expect(posts[1].slug).toBe('가벼운-헥사고날로-nestjs-나누기');
  });

  it('mock: getPosts() 기본값은 최신순이다', async () => {
    vi.stubEnv('CONTENT_SOURCE', 'mock');
    const { getPosts } = await import('@features/posts/services/posts.api');
    const posts = await getPosts();
    expect(posts[0].slug).toBe('rsc-우선-데이터-패칭');
  });

  it('mock 상세 조회는 객체 프로토타입 이름을 글로 취급하지 않는다', async () => {
    vi.stubEnv('CONTENT_SOURCE', 'mock');
    const { getPost } = await import('@features/posts/services/posts.api');
    await expect(getPost('__proto__')).rejects.toMatchObject({
      digest: 'NEXT_HTTP_ERROR_FALLBACK;404',
    });
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

  it.each([
    ['question?draft=1', '/content/posts/question%3Fdraft%3D1'],
    ['hash#part', '/content/posts/hash%23part'],
    ['nested/slug', '/content/posts/nested%2Fslug'],
  ])('api 상세 slug %s를 하나의 path segment로 전달한다', async (slug, pathname) => {
    vi.stubEnv('CONTENT_SOURCE', 'api');
    vi.stubEnv('CONTENT_API_BASE', 'https://api.raven.kr');
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ data: { slug }, meta: {} }), { status: 200 }),
      );
    vi.stubGlobal('fetch', fetchMock);
    const { getPost } = await import('@features/posts/services/posts.api');

    await getPost(slug);

    const calledUrl = fetchMock.mock.calls[0][0] as URL;
    expect(calledUrl.pathname).toBe(pathname);
    expect(calledUrl.search).toBe('');
    expect(calledUrl.hash).toBe('');
  });

  it.each(['.', '..'])('api 상세에서 경로로 정규화되는 slug %s를 404로 보낸다', async (slug) => {
    vi.stubEnv('CONTENT_SOURCE', 'api');
    vi.stubEnv('CONTENT_API_BASE', 'https://api.raven.kr');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { getPost } = await import('@features/posts/services/posts.api');

    await expect(getPost(slug)).rejects.toMatchObject({
      digest: 'NEXT_HTTP_ERROR_FALLBACK;404',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('supabase 목록은 published 조건을 직접 걸고 Post 목록 타입으로 변환한다', async () => {
    vi.stubEnv('CONTENT_SOURCE', 'supabase');
    const range = vi.fn().mockResolvedValue({
      data: [
        {
          title: '공개 글',
          slug: 'public-post',
          description: '요약',
          body: '# 본문',
          status: 'published',
          published_at: '2026-09-01T00:00:00.000Z',
          created_at: '2026-08-01T00:00:00.000Z',
          updated_at: '2026-09-02T00:00:00.000Z',
        },
      ],
      error: null,
    });
    const order = vi.fn(() => ({ range }));
    const statusEq = vi.fn(() => ({ order }));
    const select = vi.fn(() => ({ eq: statusEq }));
    const from = vi.fn(() => ({ select }));
    vi.doMock('@lib/supabase/public', () => ({ createPublicClient: () => ({ from }) }));

    const { getPosts } = await import('@features/posts/services/posts.api');
    const posts = await getPosts({ page: 2, limit: 10 });

    expect(statusEq).toHaveBeenCalledWith('status', 'published');
    expect(range).toHaveBeenCalledWith(10, 19);
    expect(posts).toEqual([
      expect.objectContaining({
        slug: 'public-post',
        summary: '요약',
        tags: [],
        cover_image_url: null,
        status: 'published',
      }),
    ]);
  });

  it('supabase 상세도 published와 slug를 함께 제한해 draft를 노출하지 않는다', async () => {
    vi.stubEnv('CONTENT_SOURCE', 'supabase');
    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        title: '공개 글',
        slug: '공개-글',
        description: '',
        body: '본문',
        status: 'published',
        published_at: null,
        created_at: '2026-08-01T00:00:00.000Z',
        updated_at: '2026-09-02T00:00:00.000Z',
      },
      error: null,
    });
    const slugEq = vi.fn(() => ({ maybeSingle }));
    const statusEq = vi.fn(() => ({ eq: slugEq }));
    const select = vi.fn(() => ({ eq: statusEq }));
    const from = vi.fn(() => ({ select }));
    vi.doMock('@lib/supabase/public', () => ({ createPublicClient: () => ({ from }) }));

    const { getPost } = await import('@features/posts/services/posts.api');
    const post = await getPost('공개-글');

    expect(statusEq).toHaveBeenCalledWith('status', 'published');
    expect(slugEq).toHaveBeenCalledWith('slug', '공개-글');
    expect(post).toEqual(
      expect.objectContaining({
        summary: null,
        published_at: '2026-08-01T00:00:00.000Z',
        body_markdown: '본문',
      }),
    );
  });

  it('새 공개 상세 모델은 category·tags·cover 메타데이터를 보존한다', async () => {
    vi.stubEnv('CONTENT_SOURCE', 'supabase');
    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        title: '공개 글',
        slug: 'public-post',
        description: '요약',
        body: '본문',
        status: 'published',
        published_at: '2026-09-01T00:00:00Z',
        created_at: '2026-08-01T00:00:00Z',
        updated_at: '2026-09-02T00:00:00Z',
        tags: ['react'],
        cover_image_key: 'covers/post.webp',
        cover_image_url: 'https://cdn.raven.kr/covers/post.webp',
        cover_position_x: 0.25,
        cover_position_y: 0.75,
        cover_alt: '대표 이미지',
        pin_order: 2,
        category: {
          id: '10000000-0000-4000-8000-000000000001',
          slug: 'engineering',
          name: '개발',
          sort_order: 1,
          is_default: false,
        },
      },
      error: null,
    });
    const slugEq = vi.fn(() => ({ maybeSingle }));
    const statusEq = vi.fn(() => ({ eq: slugEq }));
    const from = vi.fn(() => ({ select: () => ({ eq: statusEq }) }));
    vi.doMock('next/cache', () => ({
      unstable_cache:
        <TArgs extends unknown[], TResult>(fn: (...args: TArgs) => TResult) =>
        (...args: TArgs) =>
          fn(...args),
    }));
    vi.doMock('@lib/supabase/public', () => ({ createPublicClient: () => ({ from }) }));

    const { getBlogPost } = await import('@features/posts/services/posts.api');
    const post = await getBlogPost('public-post');
    expect(statusEq).toHaveBeenCalledWith('status', 'published');
    expect(post).toMatchObject({
      tags: ['react'],
      cover_image_key: 'covers/post.webp',
      cover_image_url: 'https://cdn.raven.kr/covers/post.webp',
      cover_position: { x: 0.25, y: 0.75 },
      cover_alt: '대표 이미지',
      category: { slug: 'engineering' },
      body_markdown: '본문',
    });
  });

  it('supabase 태그 필터는 정규화한 tags 배열 조건을 DB에 적용한다', async () => {
    vi.stubEnv('CONTENT_SOURCE', 'supabase');
    const contains = vi.fn().mockResolvedValue({ data: [], error: null });
    const order = vi.fn(() => ({ contains }));
    const from = vi.fn(() => ({ select: () => ({ eq: () => ({ order }) }) }));
    vi.doMock('@lib/supabase/public', () => ({ createPublicClient: () => ({ from }) }));
    const { getPosts } = await import('@features/posts/services/posts.api');
    await expect(getPosts({ tag: 'NextJS' })).resolves.toEqual([]);
    expect(contains).toHaveBeenCalledWith('tags', ['nextjs']);
  });

  it('supabase 목록의 빈 결과를 빈 배열로 정규화한다', async () => {
    vi.stubEnv('CONTENT_SOURCE', 'supabase');
    const order = vi.fn().mockResolvedValue({ data: null, error: null });
    const statusEq = vi.fn(() => ({ order }));
    const from = vi.fn(() => ({ select: () => ({ eq: statusEq }) }));
    vi.doMock('@lib/supabase/public', () => ({ createPublicClient: () => ({ from }) }));
    const { getPosts } = await import('@features/posts/services/posts.api');
    await expect(getPosts()).resolves.toEqual([]);
    expect(order).toHaveBeenCalledWith('published_at', { ascending: false, nullsFirst: false });
  });

  it('supabase 목록 오류를 공개 서비스 문맥이 있는 오류로 바꾼다', async () => {
    vi.stubEnv('CONTENT_SOURCE', 'supabase');
    const order = vi.fn().mockResolvedValue({ data: null, error: { message: 'db unavailable' } });
    const from = vi.fn(() => ({ select: () => ({ eq: () => ({ order }) }) }));
    vi.doMock('@lib/supabase/public', () => ({ createPublicClient: () => ({ from }) }));
    const { getPosts } = await import('@features/posts/services/posts.api');
    await expect(getPosts()).rejects.toThrow('공개 글 목록을 불러오지 못했습니다: db unavailable');
  });

  it('supabase 상세 오류를 공개 서비스 문맥이 있는 오류로 바꾼다', async () => {
    vi.stubEnv('CONTENT_SOURCE', 'supabase');
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'timeout' } });
    const from = vi.fn(() => ({
      select: () => ({ eq: () => ({ eq: () => ({ maybeSingle }) }) }),
    }));
    vi.doMock('@lib/supabase/public', () => ({ createPublicClient: () => ({ from }) }));
    const { getPost } = await import('@features/posts/services/posts.api');
    await expect(getPost('missing')).rejects.toThrow('공개 글을 불러오지 못했습니다: timeout');
  });

  it('supabase에 공개 상세가 없으면 notFound로 보낸다', async () => {
    vi.stubEnv('CONTENT_SOURCE', 'supabase');
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const from = vi.fn(() => ({
      select: () => ({ eq: () => ({ eq: () => ({ maybeSingle }) }) }),
    }));
    vi.doMock('@lib/supabase/public', () => ({ createPublicClient: () => ({ from }) }));
    const { getPost } = await import('@features/posts/services/posts.api');
    await expect(getPost('missing')).rejects.toMatchObject({
      digest: 'NEXT_HTTP_ERROR_FALLBACK;404',
    });
  });
});
