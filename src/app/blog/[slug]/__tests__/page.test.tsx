import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToReadableStream } from 'react-dom/server';

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
vi.mock('@/app/_components/BlogShell', () => ({
  BlogShell: ({ children }: { children: React.ReactNode }) => (
    <div data-blog-shell="">{children}</div>
  ),
}));
vi.mock('@/app/blog/[slug]/_components/TableOfContents', () => ({
  TableOfContents: () => null,
}));

import Page, { generateMetadata, generateStaticParams } from '@/app/blog/[slug]/page';

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
  category: { id: 'category', slug: 'dev', name: '개발', sort_order: 1, is_default: false },
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
const params = (slug = 'my-post') => Promise.resolve({ slug });

describe('blog article page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.env.CONTENT_SOURCE = 'mock';
    mocks.post.mockResolvedValue(post);
    mocks.categories.mockResolvedValue([]);
    mocks.posts.mockResolvedValue([post, related]);
    mocks.markdown.mockResolvedValue({ html: '<h1>본문</h1>', toc: [] });
  });

  it('한 세그먼트 canonical과 article OG 메타를 만든다', async () => {
    const metadata = await generateMetadata({ params: params() });
    expect(metadata.alternates?.canonical).toBe('/blog/my-post');
    expect(metadata.openGraph).toMatchObject({
      type: 'article',
      url: '/blog/my-post',
      publishedTime: post.published_at,
      modifiedTime: post.updated_at,
    });
    expect(metadata.title).toBe('제목');
  });

  it('한글 키를 NFC로 풀어 조회하고 인코딩된 canonical을 쓴다', async () => {
    mocks.post.mockResolvedValue({ ...post, slug: '공개-글' });
    const metadata = await generateMetadata({ params: params(encodeURIComponent('공개-글')) });
    expect(mocks.post).toHaveBeenCalledWith('공개-글');
    expect(metadata.alternates?.canonical).toBe(`/blog/${encodeURIComponent('공개-글')}`);
  });

  it('서버 응답에 본문과 BlogPosting 그래프를 함께 싣는다', async () => {
    const stream = await renderToReadableStream(await Page({ params: params() }));
    await stream.allReady;
    const html = await new Response(stream).text();
    const document = new DOMParser().parseFromString(html, 'text/html');
    const script = document.querySelector('script[type="application/ld+json"]');

    expect(html).toContain('<h1>본문</h1>');
    // JSON-LD가 Suspense 경계(<!--$-->)보다 앞이어야 첫 flush에 실린다.
    expect(html.indexOf('application/ld+json')).toBeLessThan(html.indexOf('<!--$-->'));
    expect(JSON.parse(script?.textContent ?? '')).toMatchObject({
      '@type': 'BlogPosting',
      '@id': 'https://raven.kr/blog/my-post#article',
      url: 'https://raven.kr/blog/my-post',
      headline: '제목',
      datePublished: post.published_at,
      dateModified: post.updated_at,
      author: { '@id': 'https://raven.kr/#author' },
      isPartOf: { '@id': 'https://raven.kr/#website' },
    });
  });

  it.each(['%', '%2f', '%5c', '..', '%252e%252e', '%00'])(
    '안전하지 않은 키 %s는 조회 전에 404로 끊는다',
    async (value) => {
      await expect(Page({ params: params(value) })).rejects.toMatchObject({
        digest: 'NEXT_HTTP_ERROR_FALLBACK;404',
      });
      await expect(generateMetadata({ params: params(value) })).rejects.toMatchObject({
        digest: 'NEXT_HTTP_ERROR_FALLBACK;404',
      });
      expect(mocks.post).not.toHaveBeenCalled();
    },
  );

  it('없는 글은 셸을 그리지 않고 404를 그대로 올린다', async () => {
    mocks.post.mockRejectedValue(
      Object.assign(new Error('not found'), { digest: 'NEXT_HTTP_ERROR_FALLBACK;404' }),
    );
    await expect(Page({ params: params() })).rejects.toMatchObject({
      digest: 'NEXT_HTTP_ERROR_FALLBACK;404',
    });
    expect(mocks.markdown).not.toHaveBeenCalled();
    expect(mocks.categories).not.toHaveBeenCalled();
  });

  it('supabase 소스에서는 정적 파라미터를 만들지 않는다', async () => {
    expect(await generateStaticParams()).toEqual([{ slug: 'my-post' }, { slug: 'related-post' }]);
    mocks.env.CONTENT_SOURCE = 'supabase';
    expect(await generateStaticParams()).toEqual([]);
  });
});
