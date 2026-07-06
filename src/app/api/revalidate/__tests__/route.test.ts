import { describe, it, expect, vi, beforeEach } from 'vitest';

const revalidateTag = vi.fn();
vi.mock('next/cache', () => ({ revalidateTag: (t: string) => revalidateTag(t) }));
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
    expect(revalidateTag).toHaveBeenCalledWith('post:hexagonal-nestjs');
    expect(revalidateTag).toHaveBeenCalledWith('posts');
  });
});
