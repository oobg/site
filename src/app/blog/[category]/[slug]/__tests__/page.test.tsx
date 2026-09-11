import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  post: vi.fn(),
  posts: vi.fn(),
  categories: vi.fn(),
  markdown: vi.fn(),
  env: { CONTENT_SOURCE: 'mock' },
}));
vi.mock('@configs/env', () => ({ env: mocks.env }));
vi.mock('@features/posts/services/posts.api', () => ({
  getBlogPost: mocks.post,
  getPosts: mocks.posts,
  getBlogCategories: mocks.categories,
}));
vi.mock('@lib/markdown/render', () => ({ renderMarkdown: mocks.markdown }));
vi.mock('@features/comments/components/CommentsSection', () => ({ CommentsSection: () => null }));
vi.mock('@features/comments/utils/comment-avatar', () => ({
  getCommentAvatarBaseUrl: () => undefined,
}));

import Page, { generateMetadata, generateStaticParams } from '@/app/blog/[category]/[slug]/page';

const post = {
  slug: 'my-post',
  title: '제목',
  summary: '요약',
  body_markdown: '# 본문',
  category: { slug: 'dev', name: '개발' },
  reading_time_min: 1,
};
const params = (category = 'dev', slug = 'my-post') => Promise.resolve({ category, slug });

describe('canonical blog page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.env.CONTENT_SOURCE = 'mock';
    mocks.post.mockResolvedValue(post);
    mocks.categories.mockResolvedValue([]);
    mocks.posts.mockResolvedValue([post]);
    mocks.markdown.mockResolvedValue({ html: '<h1>본문</h1>', toc: [] });
  });

  it('uses the canonical URL in metadata and retains the post content', async () => {
    const metadata = await generateMetadata({ params: params() });
    expect(metadata.alternates?.canonical).toBe('/blog/dev/my-post');
    expect(metadata.openGraph?.url).toBe('/blog/dev/my-post');
    expect(metadata.title).toBe('제목');
    expect(await Page({ params: params() })).toBeTruthy();
    expect(mocks.markdown).toHaveBeenCalledWith('# 본문');
  });

  it.each([Page, generateMetadata])(
    'returns 404 for a category mismatch before rendering or metadata',
    async (run) => {
      await expect(run({ params: params('wrong') })).rejects.toMatchObject({
        digest: 'NEXT_HTTP_ERROR_FALLBACK;404',
      });
      expect(mocks.markdown).not.toHaveBeenCalled();
      expect(mocks.categories).not.toHaveBeenCalled();
    },
  );

  it('decodes both params and normalizes Unicode to NFC', async () => {
    mocks.post.mockResolvedValue({ ...post, slug: '공개-글' });
    const metadata = await generateMetadata({
      params: params('%64ev', encodeURIComponent('공개-글')),
    });
    expect(mocks.post).toHaveBeenCalledWith('공개-글');
    expect(metadata.alternates?.canonical).toBe(`/blog/dev/${encodeURIComponent('공개-글')}`);
  });

  it('uses the previous category slug only to redirect to the Korean canonical URL', async () => {
    mocks.post.mockResolvedValue({
      ...post,
      category: { ...post.category, slug: '디자인-시스템', legacy_slug: 'design-system' },
    });

    const metadata = await generateMetadata({ params: params('design-system') });
    expect(metadata.alternates?.canonical).toBe(
      `/blog/${encodeURIComponent('디자인-시스템')}/my-post`,
    );
    await expect(Page({ params: params('design-system') })).rejects.toMatchObject({
      digest: `NEXT_REDIRECT;replace;/blog/${encodeURIComponent('디자인-시스템')}/my-post;308;`,
    });
  });

  it.each(['%', '%2f', '%5c', '..', '%252e%252e', '%00'])(
    'rejects unsafe category or slug %s before lookup',
    async (value) => {
      await expect(Page({ params: params(value) })).rejects.toMatchObject({
        digest: 'NEXT_HTTP_ERROR_FALLBACK;404',
      });
      await expect(generateMetadata({ params: params('dev', value) })).rejects.toMatchObject({
        digest: 'NEXT_HTTP_ERROR_FALLBACK;404',
      });
      expect(mocks.post).not.toHaveBeenCalled();
    },
  );

  it('propagates a missing post as 404', async () => {
    mocks.post.mockRejectedValue(
      Object.assign(new Error('not found'), { digest: 'NEXT_HTTP_ERROR_FALLBACK;404' }),
    );
    await expect(Page({ params: params() })).rejects.toMatchObject({
      digest: 'NEXT_HTTP_ERROR_FALLBACK;404',
    });
  });

  it('includes categories in static params and falls back only for legacy data', async () => {
    mocks.posts.mockResolvedValue([post, { slug: 'legacy' }]);
    expect(await generateStaticParams()).toEqual([
      { category: 'dev', slug: 'my-post' },
      { category: '미분류', slug: 'legacy' },
    ]);
    mocks.env.CONTENT_SOURCE = 'supabase';
    expect(await generateStaticParams()).toEqual([]);
  });
});
