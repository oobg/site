import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToReadableStream, renderToStaticMarkup } from 'react-dom/server';

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
vi.mock('@/app/_components/BlogShell', () => ({
  BlogShell: ({ children }: { children: React.ReactNode }) => (
    <div data-blog-shell="">{children}</div>
  ),
}));
vi.mock('@/app/blog/[slug]/_components/TableOfContents', () => ({
  TableOfContents: () => null,
}));

import Page, { generateMetadata, generateStaticParams } from '@/app/blog/[category]/[slug]/page';

const post = {
  slug: 'my-post',
  title: '제목',
  summary: '요약',
  body_markdown: '# 본문',
  tags: ['nextjs'],
  published_at: '2026-09-01T00:00:00.000Z',
  updated_at: '2026-09-02T00:00:00.000Z',
  cover_image_url: null,
  status: 'published' as const,
  frontmatter: {},
  category: {
    id: 'category',
    slug: 'dev',
    name: '개발',
    sort_order: 1,
    is_default: false,
  },
  cover_image_key: null,
  cover_position: { x: 0.5, y: 0.5 },
  cover_alt: null,
  pin_order: null,
  reading_time_min: 1,
};
const related = {
  ...post,
  slug: 'related-post',
  title: '관련 글',
  published_at: '2026-08-01T00:00:00.000Z',
  updated_at: '2026-08-01T00:00:00.000Z',
};
const params = (category = 'dev', slug = 'my-post') => Promise.resolve({ category, slug });

describe('canonical blog page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.env.CONTENT_SOURCE = 'mock';
    mocks.post.mockResolvedValue(post);
    mocks.categories.mockResolvedValue([]);
    mocks.posts.mockResolvedValue([post, related]);
    mocks.markdown.mockResolvedValue({ html: '<h1>본문</h1>', toc: [] });
  });

  it('uses the canonical URL in metadata and retains the post content', async () => {
    const metadata = await generateMetadata({ params: params() });
    expect(metadata.alternates?.canonical).toBe('/blog/dev/my-post');
    expect(metadata.openGraph?.url).toBe('/blog/dev/my-post');
    expect(metadata.openGraph).toMatchObject({
      type: 'article',
      publishedTime: post.published_at,
      modifiedTime: post.updated_at,
    });
    expect(metadata.title).toBe('제목');
    expect(await Page({ params: params() })).toBeTruthy();
    expect(mocks.markdown).toHaveBeenCalledWith('# 본문');
  });

  it('관련 글 promise가 끝나지 않아도 ArticleBody를 정적 HTML로 렌더한다', async () => {
    let resolvePosts: ((value: (typeof post)[]) => void) | undefined;
    mocks.posts.mockReturnValue(
      new Promise((resolve) => {
        resolvePosts = resolve;
      }),
    );

    const page = await Page({ params: params() });
    expect(mocks.posts).not.toHaveBeenCalled();

    const html = renderToStaticMarkup(page);
    expect(html).toContain('data-article-body=""');
    expect(html).toContain('<h1>본문</h1>');
    expect(html).toContain('관련 글을 불러오는 중');

    resolvePosts?.([post]);
  });

  it('전체 서버 응답에 본문·BlogPosting·관련 탐색 마커를 모두 포함한다', async () => {
    const stream = await renderToReadableStream(await Page({ params: params() }));
    await stream.allReady;
    const html = await new Response(stream).text();

    expect(html).toContain('data-article-body=""');
    expect(html).toContain('<h1>본문</h1>');
    expect(html).toContain('관련 글');
    const document = new DOMParser().parseFromString(html, 'text/html');
    const script = document.querySelector('script[type="application/ld+json"]');
    const data = JSON.parse(script?.textContent ?? '') as Record<string, unknown>;
    expect(data).toMatchObject({
      '@type': 'BlogPosting',
      '@id': 'https://raven.kr/blog/dev/my-post#article',
      headline: '제목',
      datePublished: post.published_at,
      dateModified: post.updated_at,
      author: { '@id': 'https://raven.kr/#author' },
      isPartOf: { '@id': 'https://raven.kr/#website' },
    });
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
