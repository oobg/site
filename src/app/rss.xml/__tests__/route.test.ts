import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  posts: vi.fn(),
  markdown: vi.fn(),
}));

vi.mock('@features/posts/services/posts.api', () => ({
  getPublishedBlogPostsForFeed: mocks.posts,
}));
vi.mock('@lib/markdown/render', () => ({ renderMarkdown: mocks.markdown }));
vi.mock('next/cache', () => ({
  unstable_cache: <T extends (...args: never[]) => unknown>(callback: T): T => callback,
}));

import { GET } from '@/app/rss.xml/route';

const post = {
  slug: '공개 & 글',
  title: 'A & <B>\u0000',
  summary: '요약 ]]> & <tag>',
  body_markdown: '# 본문',
  tags: [],
  published_at: '2026-09-11T03:00:00.000Z',
  updated_at: '2026-09-12T04:00:00.000Z',
  cover_image_url: null,
  status: 'published' as const,
  frontmatter: {},
  category: {
    id: 'category',
    slug: '개발 & 설계',
    name: '개발',
    sort_order: 1,
    is_default: false,
  },
  cover_image_key: null,
  cover_position: { x: 0.5, y: 0.5 },
  cover_alt: null,
  pin_order: null,
};

describe('GET /rss.xml', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.posts.mockResolvedValue([post]);
    mocks.markdown.mockResolvedValue({
      html: '<p><a href="/blog/other?x=1&amp;y=2">링크</a><img src="/images/x.png" />본문\u0000 ]]> </content:encoded><script>alert(1)</script></p>',
      toc: [],
    });
  });

  it('최신 공개 글의 category/slug canonical·메타·전체 HTML을 유효한 RSS로 반환한다', async () => {
    const response = await GET();
    const xml = await response.text();
    const document = new DOMParser().parseFromString(xml, 'application/xml');
    const encoded = document.getElementsByTagNameNS(
      'http://purl.org/rss/1.0/modules/content/',
      'encoded',
    )[0];

    expect(response.headers.get('content-type')).toBe('application/rss+xml; charset=utf-8');
    expect(response.headers.get('cache-control')).toBe(
      'public, s-maxage=60, stale-while-revalidate=300',
    );
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(document.querySelector('parsererror')).toBeNull();
    expect(document.querySelector('channel > title')?.textContent).toBe('raven.kr');
    expect(document.querySelector('channel > link')?.textContent).toBe('https://raven.kr/');
    const selfLink = document.getElementsByTagNameNS('http://www.w3.org/2005/Atom', 'link')[0];
    expect(selfLink?.getAttribute('href')).toBe('https://raven.kr/rss.xml');
    expect(selfLink?.getAttribute('rel')).toBe('self');
    expect(document.querySelector('item > title')?.textContent).toBe('A & <B>�');
    expect(document.querySelector('item > link')?.textContent).toBe(
      'https://raven.kr/blog/%EA%B0%9C%EB%B0%9C%20%26%20%EC%84%A4%EA%B3%84/%EA%B3%B5%EA%B0%9C%20%26%20%EA%B8%80',
    );
    expect(document.querySelector('item > guid')?.textContent).toBe(
      'https://raven.kr/blog/%EA%B0%9C%EB%B0%9C%20%26%20%EC%84%A4%EA%B3%84/%EA%B3%B5%EA%B0%9C%20%26%20%EA%B8%80',
    );
    expect(document.querySelector('item > description')?.textContent).toBe('요약 ]]> & <tag>');
    expect(document.querySelector('item > pubDate')?.textContent).toBe(
      'Fri, 11 Sep 2026 03:00:00 GMT',
    );
    expect(encoded?.textContent).toBe(
      '<p><a href="https://raven.kr/blog/other?x=1&amp;y=2">링크</a><img src="https://raven.kr/images/x.png" />본문� ]]> </content:encoded><script>alert(1)</script></p>',
    );
    expect(mocks.markdown).toHaveBeenCalledWith('# 본문');
  });

  it('글이 없어도 유효한 빈 채널을 만든다', async () => {
    mocks.posts.mockResolvedValue([]);
    const xml = await (await GET()).text();
    const document = new DOMParser().parseFromString(xml, 'application/xml');
    expect(document.querySelector('parsererror')).toBeNull();
    expect(document.querySelectorAll('item')).toHaveLength(0);
    expect(document.querySelector('lastBuildDate')).toBeNull();
  });

  it('요약이 없는 글은 제목을 피드 설명으로 사용한다', async () => {
    mocks.posts.mockResolvedValue([{ ...post, summary: null }]);
    const xml = await (await GET()).text();
    const document = new DOMParser().parseFromString(xml, 'application/xml');
    expect(document.querySelector('item > description')?.textContent).toBe('A & <B>�');
  });

  it('발행일이 깨진 글은 조용히 잘못된 피드를 내지 않는다', async () => {
    mocks.posts.mockResolvedValue([{ ...post, published_at: '언젠가' }]);
    await expect(GET()).rejects.toThrow('RSS 발행일이 유효하지 않습니다: 언젠가');
  });
});
