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
};

describe('BlogHomeContainer', () => {
  beforeEach(() => {
    mocks.search = new URLSearchParams();
    mocks.isFetching = false;
    vi.restoreAllMocks();
  });

  it('shows the public empty state and keeps category filters in the URL', () => {
    render(<BlogHomeContainer initialData={empty} initialFilters={{ page: 1, pageSize: 12 }} />);
    expect(screen.getByText('아직 공개한 글이 없어요.')).toBeInTheDocument();
    const history = vi.spyOn(window.history, 'pushState');
    fireEvent.click(screen.getByRole('tab', { name: '개발' }));
    expect(history).toHaveBeenCalledWith(null, '', '/?category=dev');
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
    expect(screen.getByPlaceholderText('제목이나 요약 검색')).toHaveValue('새검색');
  });

  it('keeps search focus after debounce and follows browser history changes', () => {
    vi.useFakeTimers();
    const history = vi.spyOn(window.history, 'replaceState');
    const { rerender } = render(
      <BlogHomeContainer initialData={empty} initialFilters={{ page: 1, pageSize: 12 }} />,
    );
    const search = screen.getByRole('searchbox');
    search.focus();
    fireEvent.change(search, { target: { value: 'react' } });
    vi.advanceTimersByTime(300);
    expect(history).toHaveBeenLastCalledWith(null, '', '/?q=react');

    mocks.search = new URLSearchParams('q=react');
    rerender(<BlogHomeContainer initialData={empty} initialFilters={{ page: 1, pageSize: 12 }} />);
    expect(screen.getByRole('searchbox')).toBe(search);
    expect(search).toHaveFocus();
    fireEvent.change(search, { target: { value: 'react query' } });
    vi.advanceTimersByTime(300);
    expect(history).toHaveBeenLastCalledWith(null, '', '/?q=react+query');

    mocks.search = new URLSearchParams();
    rerender(<BlogHomeContainer initialData={empty} initialFilters={{ page: 1, pageSize: 12 }} />);
    expect(screen.getByRole('searchbox')).toBe(search);
    expect(search).toHaveValue('');
    expect(search).toHaveFocus();
    vi.useRealTimers();
  });
});
