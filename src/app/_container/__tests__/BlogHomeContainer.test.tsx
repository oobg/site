import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BlogHomeContainer } from '@/app/_container/BlogHomeContainer';
import type { BlogHomeData } from '@features/posts/types/posts.types';

const mocks = vi.hoisted(() => ({
  refetch: vi.fn(),
  search: new URLSearchParams(),
  isFetching: false,
}));
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useSearchParams: () => mocks.search,
}));
vi.mock('@features/posts/services/use-blog-posts', () => ({
  useBlogPosts: () => ({
    data: undefined,
    isError: false,
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

describe('BlogHomeContainer', () => {
  beforeEach(() => {
    mocks.search = new URLSearchParams();
    mocks.isFetching = false;
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
    expect(screen.getByText('글을 불러오고 있어요.')).toBeInTheDocument();
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
    fireEvent.click(screen.getByRole('button', { name: '이전' }));
    expect(history).toHaveBeenCalledWith(null, '', '/?view=all');
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
});
