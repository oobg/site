import { describe, it, expect, vi, beforeEach } from 'vitest';

const revalidateTag = vi.fn();
vi.mock('next/cache', () => ({ revalidateTag: (...args: unknown[]) => revalidateTag(...args) }));
vi.mock('@configs/env', () => ({ env: { REVALIDATE_SECRET: 'test-secret' } }));

function post(headers: Record<string, string>, body: unknown) {
  return new Request('http://localhost/api/revalidate', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

describe('POST /api/revalidate', () => {
  beforeEach(() => revalidateTag.mockClear());

  it('시크릿이 틀리면 401', async () => {
    const { POST } = await import('@/app/api/revalidate/route');
    const res = await POST(post({ 'x-revalidate-secret': 'wrong' }, { changed: [] }));
    expect(res.status).toBe(401);
  });

  it('변경 항목의 태그를 무효화한다', async () => {
    const { POST } = await import('@/app/api/revalidate/route');
    const res = await POST(
      post(
        { 'x-revalidate-secret': 'test-secret' },
        {
          changed: [{ type: 'post', slug: 'hexagonal-nestjs' }],
        },
      ),
    );
    expect(res.status).toBe(200);
    expect(revalidateTag).toHaveBeenCalledWith('post:hexagonal-nestjs', {});
    expect(revalidateTag).toHaveBeenCalledWith('posts', {});
  });

  it('changed가 빈 배열이면 posts·projects 태그를 전체 무효화한다', async () => {
    const { POST } = await import('@/app/api/revalidate/route');
    const res = await POST(post({ 'x-revalidate-secret': 'test-secret' }, { changed: [] }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { revalidated: boolean; count: number };
    expect(body).toEqual({ revalidated: true, count: 0 });
    expect(revalidateTag).toHaveBeenCalledWith('posts', {});
    expect(revalidateTag).toHaveBeenCalledWith('projects', {});
  });

  it.each([
    ['malformed JSON', '{'],
    ['unknown content type', JSON.stringify({ changed: [{ type: 'page', slug: 'home' }] })],
    [
      'control character in slug',
      JSON.stringify({ changed: [{ type: 'post', slug: 'bad\nslug' }] }),
    ],
  ])('잘못된 payload(%s)는 캐시를 무효화하지 않는다', async (_label, body) => {
    const { POST } = await import('@/app/api/revalidate/route');
    const res = await POST(
      new Request('http://localhost/api/revalidate', {
        method: 'POST',
        headers: { 'x-revalidate-secret': 'test-secret', 'content-type': 'application/json' },
        body,
      }),
    );

    expect(res.status).toBe(400);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it('changed 생략은 기존 전체 목록 무효화 계약을 유지한다', async () => {
    const { POST } = await import('@/app/api/revalidate/route');
    const res = await POST(post({ 'x-revalidate-secret': 'test-secret' }, {}));

    expect(res.status).toBe(200);
    expect(revalidateTag).toHaveBeenCalledWith('posts', {});
    expect(revalidateTag).toHaveBeenCalledWith('projects', {});
  });

  it('콘텐츠 API가 허용하는 비관리자 슬러그 문자열을 그대로 사용한다', async () => {
    const { POST } = await import('@/app/api/revalidate/route');
    const res = await POST(
      post(
        { 'x-revalidate-secret': 'test-secret' },
        { changed: [{ type: 'project', slug: 'Case_Study.v2' }] },
      ),
    );

    expect(res.status).toBe(200);
    expect(revalidateTag).toHaveBeenCalledWith('project:Case_Study.v2', {});
  });

  it('100개를 넘는 변경 목록을 거부한다', async () => {
    const { POST } = await import('@/app/api/revalidate/route');
    const changed = Array.from({ length: 101 }, (_, index) => ({
      type: 'post',
      slug: `post-${index}`,
    }));
    const res = await POST(post({ 'x-revalidate-secret': 'test-secret' }, { changed }));

    expect(res.status).toBe(400);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it('returns a traceable safe error when cache invalidation fails', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    revalidateTag.mockImplementationOnce(() => {
      throw new TypeError('internal detail');
    });
    const { POST } = await import('@/app/api/revalidate/route');
    const res = await POST(
      post({ 'x-revalidate-secret': 'test-secret' }, { changed: [{ type: 'post', slug: 'post' }] }),
    );

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: 'revalidation failed' });
    expect(log).toHaveBeenCalledWith('Cache revalidation failed', { kind: 'TypeError' });
    log.mockRestore();
  });
});
