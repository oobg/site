import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { updatePostStatusAction } = vi.hoisted(() => ({ updatePostStatusAction: vi.fn() }));
vi.mock('@features/admin/services/posts.actions', () => ({ updatePostStatusAction }));
import { PostList, type AdminPostListItem } from '@features/admin/components/PostList';

// jsdom은 요소 스크롤 API를 구현하지 않으므로 복원 콜백의 호출을 직접 관찰한다.
const elementScrollTo = vi.fn();
Object.defineProperty(Element.prototype, 'scrollTo', {
  configurable: true,
  value: elementScrollTo,
});
const windowScrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

beforeEach(() => {
  sessionStorage.clear();
  elementScrollTo.mockClear();
  windowScrollTo.mockClear();
});

const posts: AdminPostListItem[] = Array.from({ length: 11 }, (_, index) => ({
  id: `post-${index}`,
  slug: `post-${index}`,
  title: `글 ${String(index).padStart(2, '0')}`,
  status: index % 2 ? 'published' : 'draft',
  createdAt: `2026-09-${String(index + 1).padStart(2, '0')}T00:00:00Z`,
  updatedAt: `2026-09-${String(index + 1).padStart(2, '0')}T00:00:00Z`,
  coverImageUrl: index === 0 ? 'https://cdn.raven.kr/cover.png' : null,
}));

describe('PostList table', () => {
  it('restores saved table and window scroll after animation frames', async () => {
    sessionStorage.setItem(
      'raven:admin-list-context',
      JSON.stringify({ scrollTop: 120, windowScrollY: 240 }),
    );
    render(<PostList posts={posts} />);
    await waitFor(() => {
      expect(elementScrollTo).toHaveBeenCalledWith({ top: 120 });
      expect(windowScrollTo).toHaveBeenCalledWith({ top: 240 });
    });
  });

  it('renders a semantic table with cover fallback and pagination', () => {
    render(<PostList posts={posts} />);
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getAllByText('이미지 없음')).toHaveLength(10);
    fireEvent.click(screen.getByRole('button', { name: '다음' }));
    expect(screen.getByText('2 / 2')).toBeInTheDocument();
  });

  it('places the category chip above the title and slug', () => {
    render(<PostList posts={[{ ...posts[0], categoryName: '디자인 시스템' }]} />);

    const title = screen.getByRole('link', { name: '글 00' });
    const content = title.closest('div');
    expect(content?.children).toHaveLength(3);
    expect(content?.children[0]).toHaveTextContent('디자인 시스템');
    expect(content?.children[1]).toHaveTextContent('글 00');
    expect(content?.children[2]).toHaveTextContent('/post-0');
    expect(screen.queryByRole('columnheader', { name: '카테고리' })).not.toBeInTheDocument();
  });

  it('sorts from the column headers in both directions and removes the sort select', () => {
    render(
      <PostList
        posts={[
          {
            ...posts[0],
            id: 'charlie',
            title: '다 제목',
            createdAt: '2026-09-01',
            updatedAt: '2026-09-03',
          },
          {
            ...posts[1],
            id: 'alpha',
            title: '가 제목',
            createdAt: '2026-09-03',
            updatedAt: '2026-09-01',
          },
          {
            ...posts[2],
            id: 'bravo',
            title: '나 제목',
            createdAt: '2026-09-02',
            updatedAt: '2026-09-02',
          },
        ]}
      />,
    );

    const table = screen.getByRole('table', { name: '글 목록' });
    const rowTitles = () =>
      [...table.querySelectorAll('tbody tr > td:nth-child(2) a')].map((node) => node.textContent);
    const titleHeader = screen.getByRole('columnheader', { name: /제목/ });
    const createdHeader = screen.getByRole('columnheader', { name: /생성일/ });
    const updatedHeader = screen.getByRole('columnheader', { name: /수정일/ });

    expect(rowTitles()).toEqual(['가 제목', '나 제목', '다 제목']);
    expect(createdHeader).toHaveAttribute('aria-sort', 'descending');
    expect(titleHeader).toHaveAttribute('aria-sort', 'none');
    expect(screen.queryByRole('combobox', { name: '정렬' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '제목' }));
    expect(rowTitles()).toEqual(['가 제목', '나 제목', '다 제목']);
    expect(titleHeader).toHaveAttribute('aria-sort', 'ascending');
    fireEvent.click(screen.getByRole('button', { name: '제목' }));
    expect(rowTitles()).toEqual(['다 제목', '나 제목', '가 제목']);
    expect(titleHeader).toHaveAttribute('aria-sort', 'descending');

    fireEvent.click(screen.getByRole('button', { name: '수정일' }));
    expect(rowTitles()).toEqual(['다 제목', '나 제목', '가 제목']);
    expect(updatedHeader).toHaveAttribute('aria-sort', 'descending');
    fireEvent.click(screen.getByRole('button', { name: '수정일' }));
    expect(rowTitles()).toEqual(['가 제목', '나 제목', '다 제목']);
    expect(updatedHeader).toHaveAttribute('aria-sort', 'ascending');

    fireEvent.click(screen.getByRole('button', { name: '생성일' }));
    expect(rowTitles()).toEqual(['가 제목', '나 제목', '다 제목']);
    expect(createdHeader).toHaveAttribute('aria-sort', 'descending');
    fireEvent.click(screen.getByRole('button', { name: '생성일' }));
    expect(rowTitles()).toEqual(['다 제목', '나 제목', '가 제목']);
    expect(createdHeader).toHaveAttribute('aria-sort', 'ascending');
  });

  it('returns to the first page when a column sort changes', () => {
    render(<PostList posts={posts} />);
    fireEvent.click(screen.getByRole('button', { name: '다음' }));
    expect(screen.getByText('2 / 2')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '제목' }));

    expect(screen.getByText('1 / 2')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '글 00' })).toBeInTheDocument();
  });

  it('centers cover thumbnails regardless of the saved cover position', () => {
    render(
      <PostList
        posts={[
          {
            ...posts[0],
            coverPositionX: 12,
            coverPositionY: 88,
          },
        ]}
      />,
    );

    expect(screen.getByRole('table').querySelector('img')).toHaveStyle({
      objectPosition: '50% 50%',
    });
  });

  it('resets pagination when filtering and shows the search empty state', () => {
    render(<PostList posts={posts} />);
    fireEvent.click(screen.getByRole('button', { name: '다음' }));
    fireEvent.change(screen.getByRole('searchbox', { name: '제목 검색' }), {
      target: { value: '없는 글' },
    });
    expect(screen.getByText('조건에 맞는 글이 없어요')).toBeInTheDocument();
  });

  it('keeps the previous status on failure and updates it on success', async () => {
    updatePostStatusAction.mockResolvedValueOnce({ status: 'error', message: '실패' });
    render(<PostList posts={[posts[0]]} />);
    const select = screen.getByRole('combobox', { name: '글 00 상태' });
    fireEvent.change(select, { target: { value: 'published' } });
    await waitFor(() => expect(screen.getByText('실패')).toBeInTheDocument());
    expect(select).toHaveValue('draft');
    updatePostStatusAction.mockResolvedValueOnce({
      status: 'success',
      message: '공개',
      updatedAt: '2026-09-12T00:00:00Z',
    });
    fireEvent.change(select, { target: { value: 'published' } });
    await waitFor(() => expect(select).toHaveValue('published'));
  });

  it('uses newer server props instead of a stale optimistic override', async () => {
    updatePostStatusAction.mockResolvedValueOnce({
      status: 'success',
      message: '공개',
      updatedAt: '2026-09-12T00:00:00Z',
    });
    const { rerender } = render(<PostList posts={[posts[0]]} />);
    const select = screen.getByRole('combobox', { name: '글 00 상태' });
    fireEvent.change(select, { target: { value: 'published' } });
    await waitFor(() => expect(select).toHaveValue('published'));
    rerender(
      <PostList posts={[{ ...posts[0], status: 'draft', updatedAt: '2026-09-13T00:00:00Z' }]} />,
    );
    expect(select).toHaveValue('draft');
  });
});

describe('PostList', () => {
  it('빈 목록에서도 필터와 테이블 구조를 유지한다', () => {
    render(<PostList posts={[]} />);
    expect(screen.getByLabelText('글 상태')).toBeVisible();
    expect(screen.getByRole('searchbox', { name: '제목 검색' })).toBeVisible();
    expect(screen.getByRole('table', { name: '글 목록' })).toBeVisible();
    expect(screen.getByText('아직 작성한 글이 없어요')).toBeVisible();
  });

  it('생성일 최신순으로 정렬하고 제목과 카테고리 필터를 조합한다', () => {
    render(
      <PostList
        categories={[{ id: 'dev', name: '개발', slug: 'dev', sort_order: 1, is_default: false }]}
        posts={[
          {
            id: 'old',
            slug: 'old',
            title: '공통 글',
            status: 'published',
            createdAt: '2024-01-01',
            updatedAt: '2026-01-02',
            categoryId: 'dev',
            categoryName: '개발',
          },
          {
            id: 'new',
            slug: 'new',
            title: '공통 글 최신',
            status: 'published',
            createdAt: '2025-01-01',
            updatedAt: '2024-01-02',
            categoryId: 'dev',
            categoryName: '개발',
          },
          {
            id: 'other',
            slug: 'other',
            title: '공통 글 다른 분류',
            status: 'published',
            createdAt: '2026-01-01',
            updatedAt: '2026-01-02',
            categoryId: 'other',
            categoryName: '기타',
          },
        ]}
      />,
    );
    expect(
      [...screen.getByRole('table', { name: '글 목록' }).querySelectorAll('time')].map((node) =>
        node.getAttribute('dateTime'),
      ),
    ).toEqual(['2026-01-01', '2026-01-02', '2025-01-01', '2024-01-02', '2024-01-01', '2026-01-02']);
    fireEvent.change(screen.getByRole('combobox', { name: '카테고리 필터' }), {
      target: { value: 'dev' },
    });
    fireEvent.change(screen.getByRole('searchbox', { name: '제목 검색' }), {
      target: { value: '최신' },
    });
    expect(screen.getByRole('link', { name: '공통 글 최신' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '공통 글' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '공통 글 다른 분류' })).not.toBeInTheDocument();
  });
});
