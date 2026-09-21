import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BlogHomeContainer } from '@/app/_container/BlogHomeContainer';
import type { BlogHomeData } from '@features/posts/types/posts.types';

const mocks = vi.hoisted(() => ({
  refetch: vi.fn(),
  search: new URLSearchParams(),
  isFetching: false,
  isError: false,
}));
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useSearchParams: () => mocks.search,
}));
vi.mock('@features/posts/services/use-blog-posts', () => ({
  useBlogPosts: () => ({
    data: undefined,
    isError: mocks.isError,
    isFetching: mocks.isFetching,
    refetch: mocks.refetch,
  }),
}));

const empty: BlogHomeData = {
  featured: [],
  archive: { items: [], page: 1, pageSize: 12, totalItems: 0, totalPages: 0 },
  categories: [
    { id: 'c1', slug: 'dev', name: '개발', sort_order: 0, is_default: false, post_count: 2 },
  ],
  sections: [],
};
const item = {
  slug: 'one',
  title: '글',
  summary: null,
  tags: [],
  published_at: '2026-09-10T00:00:00Z',
  updated_at: '2026-09-10T00:00:00Z',
  cover_image_url: null,
  status: 'published' as const,
  category: empty.categories[0],
  cover_image_key: null,
  cover_position: { x: 0.5, y: 0.5 },
  cover_alt: null,
  pin_order: null,
};

function makePost(slug: string, title: string) {
  return { ...item, slug, title };
}

describe('BlogHomeContainer', () => {
  beforeEach(() => {
    mocks.search = new URLSearchParams();
    mocks.isFetching = false;
    mocks.isError = false;
    vi.restoreAllMocks();
  });

  it('shows the public empty state and keeps category filters in the URL', () => {
    mocks.search = new URLSearchParams('view=all');
    render(<BlogHomeContainer initialData={empty} initialFilters={{ page: 1, pageSize: 12 }} />);
    expect(screen.getByText('아직 공개한 글이 없어요.')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: '개발' })[0]).toHaveAttribute(
      'href',
      '/?category=dev',
    );
  });

  it('clears an existing legacy tag filter without converting it to a category', () => {
    mocks.search = new URLSearchParams('tag=nextjs');
    const history = vi.spyOn(window.history, 'pushState');
    render(
      <BlogHomeContainer
        initialData={empty}
        initialFilters={{ tag: 'nextjs', page: 1, pageSize: 12 }}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: '태그 필터 지우기' }));
    expect(history).toHaveBeenCalledWith(null, '', '/');
  });

  it('restores the tag filter when browser history returns to its URL', () => {
    mocks.search = new URLSearchParams();
    const { rerender } = render(
      <BlogHomeContainer initialData={empty} initialFilters={{ tag: 'nextjs', page: 1 }} />,
    );
    expect(screen.queryByText('태그: nextjs')).not.toBeInTheDocument();
    mocks.search = new URLSearchParams('tag=nextjs');
    rerender(<BlogHomeContainer initialData={empty} initialFilters={{ tag: 'nextjs', page: 1 }} />);
    expect(screen.getByText('태그: nextjs')).toBeInTheDocument();
  });

  it('shows pending instead of stale initial results for a new URL filter', () => {
    mocks.search = new URLSearchParams('q=새검색');
    render(
      <BlogHomeContainer
        initialData={empty}
        initialFilters={{ q: '이전검색', page: 1, pageSize: 12 }}
      />,
    );
    expect(screen.getByLabelText('글 목록을 불러오는 중')).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByText('아직 공개한 글이 없어요.')).not.toBeInTheDocument();
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
  });

  it('keeps URL search results while omitting the retired sidebar search input', () => {
    mocks.search = new URLSearchParams('q=react');
    render(
      <BlogHomeContainer
        initialData={empty}
        initialFilters={{ q: 'react', page: 1, pageSize: 12 }}
      />,
    );
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    expect(screen.getByText('조건에 맞는 글이 없어요.')).toBeInTheDocument();
  });

  it('keeps the all-post archive when pagination returns to page one', () => {
    mocks.search = new URLSearchParams('view=all&page=2');
    const history = vi.spyOn(window.history, 'pushState');
    render(
      <BlogHomeContainer
        initialData={{
          ...empty,
          archive: { ...empty.archive, items: [item], page: 2, totalItems: 13, totalPages: 2 },
        }}
        initialFilters={{ page: 2, pageSize: 12 }}
      />,
    );
    fireEvent.click(screen.getByRole('link', { name: '이전' }));
    expect(history).toHaveBeenCalledWith(null, '', '/?view=all');
  });

  it('offers pagination as real links and leaves no clickable dead end', () => {
    mocks.search = new URLSearchParams('view=all&page=2');
    render(
      <BlogHomeContainer
        initialData={{
          ...empty,
          archive: { ...empty.archive, items: [item], page: 2, totalItems: 30, totalPages: 3 },
        }}
        initialFilters={{ page: 2, pageSize: 12 }}
      />,
    );
    /* 주소가 그대로 붙어 있어야 새 탭·북마크·뒤로가기가 전부 성립한다. */
    expect(screen.getByRole('link', { name: '이전' })).toHaveAttribute('href', '/?view=all');
    expect(screen.getByRole('link', { name: '다음' })).toHaveAttribute('href', '/?view=all&page=3');

    /* 갈 곳이 없는 방향은 링크가 아니다 — 눌러도 아무 일이 없는 것을 내놓지 않는다. */
    const history = vi.spyOn(window.history, 'pushState');
    fireEvent.click(screen.getByRole('link', { name: '다음' }));
    expect(history).toHaveBeenCalledWith(null, '', '/?view=all&page=3');
  });

  it('pulls the results back to the top after a client-side page change', () => {
    mocks.search = new URLSearchParams('view=all&page=2');
    const scrollIntoView = vi.fn();
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoView,
    });
    render(
      <BlogHomeContainer
        initialData={{
          ...empty,
          archive: { ...empty.archive, items: [item], page: 2, totalItems: 30, totalPages: 3 },
        }}
        initialFilters={{ page: 2, pageSize: 12 }}
      />,
    );
    fireEvent.click(screen.getByRole('link', { name: '다음' }));
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'start', behavior: 'smooth' });
    Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView');
  });

  it('names the archive after the active search, category, or tag', () => {
    const categories = [{ ...empty.categories[0], slug: 'dev', name: '개발' }];
    const filtered = {
      ...empty,
      categories,
      archive: { ...empty.archive, items: [item], totalItems: 1, totalPages: 1 },
    };

    mocks.search = new URLSearchParams('q=react');
    const { unmount } = render(
      <BlogHomeContainer initialData={filtered} initialFilters={{ q: 'react', page: 1 }} />,
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('‘react’ 검색 결과');
    expect(screen.getByText('검색: react')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('글 1개');
    unmount();

    mocks.search = new URLSearchParams('category=dev');
    const withCategory = render(
      <BlogHomeContainer initialData={filtered} initialFilters={{ category: 'dev', page: 1 }} />,
    );
    /* 슬러그가 아니라 사람이 읽는 이름으로 말한다. */
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('개발');
    expect(screen.getByText('카테고리: 개발')).toBeInTheDocument();
    withCategory.unmount();

    mocks.search = new URLSearchParams('tag=nextjs');
    render(
      <BlogHomeContainer initialData={filtered} initialFilters={{ tag: 'nextjs', page: 1 }} />,
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('#nextjs');
  });

  it('gives every filter kind its own clear action', () => {
    const categories = [{ ...empty.categories[0], slug: 'dev', name: '개발' }];
    mocks.search = new URLSearchParams('q=react&category=dev&tag=nextjs');
    const history = vi.spyOn(window.history, 'pushState');
    render(
      <BlogHomeContainer
        initialData={{ ...empty, categories }}
        initialFilters={{ q: 'react', category: 'dev', tag: 'nextjs', page: 1 }}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: '검색어 지우기' }));
    expect(history).toHaveBeenCalledWith(null, '', '/?category=dev&tag=nextjs');
    fireEvent.click(screen.getByRole('button', { name: '카테고리 필터 지우기' }));
    expect(history).toHaveBeenCalledWith(null, '', '/?q=react&tag=nextjs');
    fireEvent.click(screen.getByRole('button', { name: '태그 필터 지우기' }));
    expect(history).toHaveBeenCalledWith(null, '', '/?q=react&category=dev');
  });

  it('matches category slugs exactly and preserves modified link clicks', () => {
    const categories = [
      { ...empty.categories[0], id: 'ai', slug: 'ai', name: 'AI' },
      { ...empty.categories[0], id: 'ai-tools', slug: 'ai-tools', name: 'AI 도구' },
    ];
    mocks.search = new URLSearchParams('category=ai');
    const { unmount } = render(
      <BlogHomeContainer
        initialData={{ ...empty, categories }}
        initialFilters={{ category: 'ai', page: 1 }}
      />,
    );
    expect(
      screen
        .getAllByRole('link', { name: 'AI' })
        .every((link) => link.getAttribute('aria-current') === 'page'),
    ).toBe(true);
    expect(
      screen
        .getAllByRole('link', { name: 'AI 도구' })
        .every((link) => !link.hasAttribute('aria-current')),
    ).toBe(true);
    unmount();

    mocks.search = new URLSearchParams();
    const history = vi.spyOn(window.history, 'pushState');
    render(<BlogHomeContainer initialData={empty} initialFilters={{ page: 1 }} />);
    fireEvent.click(screen.getByRole('link', { name: '전체 글 보기' }), { metaKey: true });
    expect(history).not.toHaveBeenCalled();
  });

  it('ranks the page title above the featured and section headings', () => {
    const featured = makePost('featured', '추천된 글');
    render(
      <BlogHomeContainer
        initialData={{
          ...empty,
          featured: [featured],
          archive: {
            ...empty.archive,
            items: [featured, makePost('a', '가'), makePost('b', '나'), makePost('c', '다')],
            totalItems: 4,
            totalPages: 1,
          },
        }}
        initialFilters={{ page: 1, pageSize: 12 }}
      />,
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('기술 블로그');
    const sectionLabels = screen
      .getAllByRole('heading', { level: 2 })
      .map((heading) => heading.textContent);
    expect(sectionLabels).toContain('추천 글');
    expect(sectionLabels).toContain('최근 글');
    /* 추천 캐러셀의 글 제목은 "추천 글" 레이블 아래 층이어야 한다. */
    expect(screen.getByRole('heading', { name: '추천된 글' }).tagName).toBe('H3');
  });

  it('does not repeat the featured post inside the recent grid', () => {
    const featured = makePost('featured', '추천된 글');
    render(
      <BlogHomeContainer
        initialData={{
          ...empty,
          featured: [featured],
          archive: {
            ...empty.archive,
            items: [featured, makePost('a', '가'), makePost('b', '나'), makePost('c', '다')],
            totalItems: 4,
            totalPages: 1,
          },
        }}
        initialFilters={{ page: 1, pageSize: 12 }}
      />,
    );
    const recent = screen.getByRole('region', { name: '최근 글' });
    expect(
      within(recent)
        .getAllByRole('heading')
        .map((heading) => heading.textContent),
    ).toEqual(['최근 글', '가', '나', '다']);
  });

  it('replaces the overview with the failure instead of stacking it on stale posts', () => {
    mocks.isError = true;
    const featured = makePost('featured', '추천된 글');
    render(
      <BlogHomeContainer
        initialData={{
          ...empty,
          featured: [featured],
          archive: { ...empty.archive, items: [featured], totalItems: 1, totalPages: 1 },
        }}
        initialFilters={{ page: 1, pageSize: 12 }}
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('글을 불러오지 못했어요.');
    expect(screen.queryByRole('heading', { name: '추천된 글' })).not.toBeInTheDocument();
    expect(screen.queryByText('최근 글')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(mocks.refetch).toHaveBeenCalled();
  });

  it('shows nothing but the empty message when there are no posts yet', () => {
    const { container } = render(
      <BlogHomeContainer initialData={empty} initialFilters={{ page: 1, pageSize: 12 }} />,
    );
    expect(screen.getByText('아직 공개한 글이 없어요.')).toBeInTheDocument();
    /* 빈 격자·빈 섹션 껍데기가 남으면 "불러오는 중"으로 읽힌다. */
    expect(container.querySelector('[class*="recentGrid"]')).toBeNull();
    expect(container.querySelector('[class*="sections"]')).toBeNull();
  });
});
