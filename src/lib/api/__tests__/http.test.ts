import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const notFoundError = new Error('NEXT_NOT_FOUND');

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw notFoundError;
  }),
}));

describe('apiGet', () => {
  beforeEach(() => {
    vi.stubEnv('CONTENT_API_BASE', 'https://api.raven.kr/root/');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  async function load() {
    return (await import('../http')).apiGet;
  }

  it('envelope data를 반환하고 캐시 옵션과 URL 인코딩을 전달한다', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ data: { ok: true }, meta: {} }), { status: 200 }),
      );
    vi.stubGlobal('fetch', fetchMock);
    const apiGet = await load();

    await expect(
      apiGet('/posts/한 글', {
        searchParams: { page: 0, tag: '한 글', omitted: undefined },
        tags: ['posts', 'post:한 글'],
        revalidate: 0,
      }),
    ).resolves.toEqual({ ok: true });

    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      URL,
      RequestInit & { next: unknown },
    ];
    expect(url.pathname).toBe('/posts/%ED%95%9C%20%EA%B8%80');
    expect(url.search).toBe('?page=0&tag=%ED%95%9C+%EA%B8%80');
    expect(init.next).toEqual({ tags: ['posts', 'post:한 글'], revalidate: 0 });
  });

  it('옵션이 없으면 기본 재검증 시간을 쓴다', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ data: [], meta: {} }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const apiGet = await load();
    await expect(apiGet('/posts')).resolves.toEqual([]);
    expect(fetchMock.mock.calls[0][1]).toEqual({ next: { tags: undefined, revalidate: 3600 } });
  });

  it('404는 Next.js notFound 흐름으로 보낸다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 404 })));
    const apiGet = await load();
    await expect(apiGet('/missing')).rejects.toBe(notFoundError);
  });

  it('서버 오류에는 상태와 요청 경로를 남긴다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 503 })));
    const apiGet = await load();
    await expect(apiGet('/posts')).rejects.toThrow('content api 503 for /posts');
  });

  it('JSON이 아닌 성공 응답을 거부한다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('not-json', { status: 200 })));
    const apiGet = await load();
    await expect(apiGet('/posts')).rejects.toBeInstanceOf(SyntaxError);
  });

  it.each([null, {}, { meta: {} }])('data가 없는 잘못된 envelope %j를 거부한다', async (body) => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status: 200 })),
    );
    const apiGet = await load();
    await expect(apiGet('/posts')).rejects.toThrow('invalid content api response for /posts');
  });

  it.each([null, [], '', 0])('유효한 빈 data %j는 그대로 반환한다', async (data) => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ data, meta: {} }), { status: 200 })),
    );
    const apiGet = await load();
    await expect(apiGet('/posts')).resolves.toEqual(data);
  });
});
