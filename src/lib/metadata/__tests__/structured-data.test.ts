import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  AUTHOR_ID,
  WEBSITE_ID,
  buildBlogPostingStructuredData,
  buildSiteStructuredData,
  serializeJsonLd,
} from '@lib/metadata/structured-data';
import type { BlogPost } from '@features/posts/types/posts.types';

const post: BlogPost = {
  slug: 'my-post',
  title: '보이는 글 제목',
  summary: '보이는 글 요약',
  body_markdown: '본문',
  tags: ['nextjs'],
  published_at: '2026-09-01T00:00:00.000Z',
  updated_at: '2026-09-02T00:00:00.000Z',
  cover_image_url: '/assets/cover.webp',
  reading_time_min: 2,
  status: 'published',
  frontmatter: {},
  category: {
    id: 'category',
    slug: 'dev',
    name: '개발',
    sort_order: 1,
    is_default: false,
  },
  cover_image_key: 'assets/cover.webp',
  cover_position: { x: 0.5, y: 0.5 },
  cover_alt: '커버',
  pin_order: null,
};

describe('structured data', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('WebSite·Person ID와 공개 이름만 선언한다', () => {
    const data = buildSiteStructuredData();
    expect(data['@graph']).toEqual([
      expect.objectContaining({ '@type': 'WebSite', '@id': WEBSITE_ID, name: 'raven.kr' }),
      expect.objectContaining({ '@type': 'Person', '@id': AUTHOR_ID, name: 'Raven' }),
    ]);
    expect(JSON.stringify(data)).not.toContain('sameAs');
  });

  it.each(['https://raven.kr', 'https://dev.raven.kr', 'http://localhost:3500'])(
    'SITE_URL=%s에서 사이트·entity ID·본문 canonical의 origin을 일치시킨다',
    async (origin) => {
      vi.stubEnv('SITE_URL', origin);
      vi.resetModules();
      const structuredData = await import('@lib/metadata/structured-data');
      const { baseMetadata, buildArticleMetadata } = await import('@lib/metadata/metadata');
      const path = '/blog/dev/my-post';
      const metadata = buildArticleMetadata({
        title: post.title,
        path,
        publishedTime: post.published_at,
        modifiedTime: post.updated_at,
      });
      const canonical = new URL(
        metadata.alternates?.canonical as string,
        baseMetadata.metadataBase!,
      ).href;

      expect(structuredData.WEBSITE_ID).toBe(`${origin}/#website`);
      expect(structuredData.AUTHOR_ID).toBe(`${origin}/#author`);
      expect(structuredData.buildSiteStructuredData()['@graph']).toEqual([
        expect.objectContaining({
          '@type': 'WebSite',
          '@id': `${origin}/#website`,
          url: `${origin}/`,
          author: { '@id': `${origin}/#author` },
        }),
        expect.objectContaining({ '@type': 'Person', '@id': `${origin}/#author` }),
      ]);
      expect(structuredData.buildBlogPostingStructuredData(post, path)).toMatchObject({
        '@id': `${canonical}#article`,
        url: canonical,
        mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
        image: `${origin}/assets/cover.webp`,
        author: { '@id': `${origin}/#author` },
        publisher: { '@id': `${origin}/#author` },
        isPartOf: { '@id': `${origin}/#website` },
      });
    },
  );

  it('가시 게시글 메타와 canonical URL로 BlogPosting을 만든다', () => {
    expect(buildBlogPostingStructuredData(post, '/blog/dev/my-post')).toMatchObject({
      '@type': 'BlogPosting',
      '@id': 'https://raven.kr/blog/dev/my-post#article',
      url: 'https://raven.kr/blog/dev/my-post',
      headline: '보이는 글 제목',
      description: '보이는 글 요약',
      datePublished: '2026-09-01T00:00:00.000Z',
      dateModified: '2026-09-02T00:00:00.000Z',
      image: 'https://raven.kr/assets/cover.webp',
      author: { '@id': AUTHOR_ID },
      publisher: { '@id': AUTHOR_ID },
      isPartOf: { '@id': WEBSITE_ID },
    });
  });

  it('inline script 종료·HTML 해석 문자를 이스케이프하고 JSON 값은 보존한다', () => {
    const value = { text: '</script><script>&\u2028\u2029' };
    const serialized = serializeJsonLd(value);
    expect(serialized).not.toContain('</script>');
    expect(serialized).not.toContain('<');
    expect(JSON.parse(serialized)).toEqual(value);
  });
});
