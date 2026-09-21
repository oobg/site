import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToReadableStream } from 'react-dom/server';

const mocks = vi.hoisted(() => ({
  post: vi.fn(),
  posts: vi.fn(),
  categories: vi.fn(),
  markdown: vi.fn(),
  shellProps: [] as Record<string, unknown>[],
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

/* 셸은 받은 props를 기록만 하고, 상세 전용 슬롯을 실제 셸과 같은 자리에 그린다. */
vi.mock('@/app/_components/BlogShell', () => ({
  BlogShell: (props: {
    detail?: boolean;
    mobileDetailNavigation?: React.ReactNode;
    children: React.ReactNode;
  }) => {
    mocks.shellProps.push(props as Record<string, unknown>);
    return (
      <div data-blog-shell="">
        <aside data-shell-sidebar="" />
        {props.mobileDetailNavigation ? (
          <div data-mobile-detail="">{props.mobileDetailNavigation}</div>
        ) : null}
        <div data-shell-content="">{props.children}</div>
      </div>
    );
  },
}));
vi.mock('@/app/blog/[slug]/_components/TableOfContents', () => ({
  TableOfContents: () => <nav data-toc="" aria-label="목차" />,
}));

import Page from '@/app/blog/[slug]/page';
import articleStyles from '@/app/blog/[slug]/article.module.css';

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

async function renderPage() {
  const stream = await renderToReadableStream(
    await Page({ params: Promise.resolve({ slug: 'my-post' }) }),
  );
  await stream.allReady;
  const html = await new Response(stream).text();
  return new DOMParser().parseFromString(html, 'text/html');
}

const articleCss = () =>
  readFileSync(resolve(process.cwd(), 'src/app/blog/[slug]/article.module.css'), 'utf8');

describe('글 상세 레이아웃', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.shellProps.length = 0;
    mocks.env.CONTENT_SOURCE = 'mock';
    mocks.post.mockResolvedValue(post);
    mocks.categories.mockResolvedValue([]);
    mocks.posts.mockResolvedValue([post]);
    mocks.markdown.mockResolvedValue({
      html: '<h1>본문</h1>',
      toc: [{ id: 'h', text: '제목', depth: 2 }],
    });
  });

  /* 목차는 본문 오른쪽의 빈 레일로 옮겼다. 왼쪽 레일에 같이 있던 시절에는 레일 하나가
     사이트 안 위치와 글 안 위치를 동시에 말해 위계가 겹쳤다. */
  it('데스크톱 목차는 본문 오른쪽 레일에 있고 왼쪽 레일에는 없다', async () => {
    const document = await renderPage();
    const rail = document.querySelector(`.${articleStyles.tocRail}`);

    expect(rail).not.toBeNull();
    expect(rail?.querySelector('[data-toc]')).not.toBeNull();
    expect(rail?.closest('[data-shell-content]')).not.toBeNull();
    expect(document.querySelector('[data-shell-sidebar] [data-toc]')).toBeNull();
    // 본문과 오른쪽 레일은 같은 읽기 그리드의 형제다.
    expect(rail?.parentElement?.className).toContain(articleStyles.page);
    expect(rail?.parentElement?.querySelector(`.${articleStyles.main}`)).not.toBeNull();
  });

  it('상세임을 셸에 알리고 모바일 접이식 목차만 셸에 넘긴다', async () => {
    await renderPage();
    const props = mocks.shellProps.at(-1);
    expect(props?.detail).toBe(true);
    expect(props?.mobileDetailNavigation).toBeTruthy();
    expect(props).not.toHaveProperty('detailNavigation');
  });

  /* 두 벌을 동시에 보이게 두면 같은 목차가 화면에 두 번 뜬다. 1200 이하는 본문 위
     접이식 하나, 900 이하는 셸도 한 열이다. 경계는 CSS가 나누므로 규칙 자체를 잡는다. */
  it('1200 이하에서 오른쪽 레일을 접어 목차가 겹치지 않는다', () => {
    const css = articleCss();
    const narrow = css.match(/@media \(max-width: 1200px\) \{([\s\S]*)\n\}/)?.[1] ?? '';
    expect(narrow).toMatch(/\.tocRail \{[^}]*display: none/);
    expect(narrow).toMatch(/\.page \{[^}]*display: block/);
  });

  /* 읽기 폭을 그리드 트랙이 들고 있어야 목차 유무로 본문 폭이 달라지지 않는다. */
  it('읽기 열은 목차와 무관하게 같은 폭 토큰을 쓴다', () => {
    const page = articleCss().match(/\.page \{([\s\S]*?)\n\}/)?.[1] ?? '';
    expect(page).toMatch(/grid-template-columns:\s*minmax\(0, var\(--w-reading\)\)/);
    expect(articleCss()).toMatch(
      /\.tocRail \{[\s\S]*?position: sticky[\s\S]*?top: var\(--rail-top\)/,
    );
  });
});
