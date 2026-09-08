import { afterEach, describe, expect, it, vi } from 'vitest';

describe('projects.api', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('글이 supabase 소스여도 프로젝트는 기존 mock 데이터를 유지한다', async () => {
    vi.stubEnv('CONTENT_SOURCE', 'supabase');
    const { getProjects } = await import('@features/projects/services/projects.api');

    const projects = await getProjects();

    expect(projects.length).toBeGreaterThan(0);
    expect(projects.every((project) => project.status === 'published')).toBe(true);
  });

  it('mock 상세 조회는 객체 프로토타입 이름을 프로젝트로 취급하지 않는다', async () => {
    vi.stubEnv('CONTENT_SOURCE', 'mock');
    const { getProject } = await import('@features/projects/services/projects.api');
    await expect(getProject('constructor')).rejects.toMatchObject({
      digest: 'NEXT_HTTP_ERROR_FALLBACK;404',
    });
  });

  it('mock 프로젝트를 태그로 거르고 limit을 적용한다', async () => {
    vi.stubEnv('CONTENT_SOURCE', 'mock');
    const { getProjects } = await import('@features/projects/services/projects.api');
    await expect(getProjects({ tag: 'missing' })).resolves.toEqual([]);
    const projects = await getProjects({ tag: 'backend', limit: 1 });
    expect(projects).toHaveLength(1);
    expect(projects[0].slug).toBe('raven-api');
  });

  it('mock 프로젝트 상세를 반환하고 없는 slug는 notFound로 보낸다', async () => {
    vi.stubEnv('CONTENT_SOURCE', 'mock');
    const { getProject } = await import('@features/projects/services/projects.api');
    await expect(getProject('raven-api')).resolves.toEqual(
      expect.objectContaining({ slug: 'raven-api', body_markdown: expect.any(String) }),
    );
    await expect(getProject('missing')).rejects.toMatchObject({
      digest: 'NEXT_HTTP_ERROR_FALLBACK;404',
    });
  });

  it('api 목록 요청에 필터·페이지·정렬을 전달하고 data를 반환한다', async () => {
    vi.stubEnv('CONTENT_SOURCE', 'api');
    vi.stubEnv('CONTENT_API_BASE', 'https://api.raven.kr');
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ data: [], meta: {} }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const { getProjects } = await import('@features/projects/services/projects.api');
    await expect(
      getProjects({ tag: 'backend', page: 2, limit: 0, sort: 'title' }),
    ).resolves.toEqual([]);
    const calledUrl = fetchMock.mock.calls[0][0] as URL;
    expect(calledUrl.pathname).toBe('/content/projects');
    expect(Object.fromEntries(calledUrl.searchParams)).toEqual({
      tag: 'backend',
      page: '2',
      limit: '0',
      sort: 'title',
    });
  });

  it('api 상세 slug와 캐시 태그를 정확히 전달한다', async () => {
    vi.stubEnv('CONTENT_SOURCE', 'api');
    vi.stubEnv('CONTENT_API_BASE', 'https://api.raven.kr');
    const project = {
      slug: '한글-프로젝트',
      title: '프로젝트',
      summary: null,
      tags: [],
      published_at: '',
      updated_at: '',
      cover_image_url: null,
      status: 'published',
      body_markdown: '본문',
      frontmatter: {},
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ data: project, meta: {} }), { status: 200 }),
      );
    vi.stubGlobal('fetch', fetchMock);
    const { getProject } = await import('@features/projects/services/projects.api');
    await expect(getProject('한글-프로젝트')).resolves.toEqual(project);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [URL, { next: { tags: string[] } }];
    expect(url.pathname).toBe(
      '/content/projects/%ED%95%9C%EA%B8%80-%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8',
    );
    expect(init.next.tags).toEqual(['project:한글-프로젝트']);
  });
});
