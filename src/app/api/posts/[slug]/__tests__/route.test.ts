import { beforeEach, describe, expect, it, vi } from 'vitest';

const { findBlogPost } = vi.hoisted(() => ({ findBlogPost: vi.fn() }));
vi.mock('@features/posts/services/posts.api', () => ({ findBlogPost }));
import { GET } from '@/app/api/posts/[slug]/route';

const request = new Request('https://raven.kr/api/posts/post');
const context = (slug: string) => ({ params: Promise.resolve({ slug }) });

describe('GET /api/posts/[slug]', () => {
  beforeEach(() => findBlogPost.mockReset());

  it('공개 상세를 JSON no-store로 반환한다', async () => {
    findBlogPost.mockResolvedValue({ slug: 'post' });
    const response = await GET(request, context('post'));
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  it('notFound를 빈 body 대신 JSON 404로 변환한다', async () => {
    findBlogPost.mockResolvedValue(null);
    const response = await GET(request, context('missing'));
    expect(response.status).toBe(404);
    expect(response.headers.get('cache-control')).toBe('no-store');
    await expect(response.json()).resolves.toEqual({ error: '글을 찾을 수 없습니다.' });
  });
});
