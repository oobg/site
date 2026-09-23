import { describe, expect, it, vi } from 'vitest';

vi.mock('@features/posts/services/posts.api', () => ({
  getPosts: vi
    .fn()
    .mockResolvedValue([
      { slug: 'my-post', category: { slug: 'dev' }, updated_at: '2026-09-10T00:00:00.000Z' },
    ]),
}));
const { getProjects } = vi.hoisted(() => ({
  getProjects: vi
    .fn()
    .mockResolvedValue([{ slug: 'project', updated_at: '2026-09-09T00:00:00.000Z' }]),
}));
vi.mock('@features/projects/services/projects.api', () => ({ getProjects }));

describe('sitemap', () => {
  it('includes public index and detail URLs without duplicates', async () => {
    const { default: sitemap } = await import('@/app/sitemap');
    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).toContain('https://raven.kr/');
    expect(urls).toContain('https://raven.kr/blog/dev/my-post');
    expect(urls).not.toContain('https://raven.kr/blog');
    expect(new Set(urls).size).toBe(urls.length);
    expect(urls.some((url) => url.includes('/admin'))).toBe(false);
  });

  it('keeps hidden project URLs out while projects are not indexable', async () => {
    const { default: sitemap } = await import('@/app/sitemap');
    const urls = (await sitemap()).map((entry) => entry.url);

    expect(urls.some((url) => url.includes('/projects'))).toBe(false);
    expect(getProjects).not.toHaveBeenCalled();
  });
});
