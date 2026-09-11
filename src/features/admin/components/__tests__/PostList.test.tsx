import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const { updatePostStatusAction } = vi.hoisted(() => ({ updatePostStatusAction: vi.fn() }));
vi.mock('@features/admin/services/posts.actions', () => ({ updatePostStatusAction }));
import { PostList, type AdminPostListItem } from '@features/admin/components/PostList';

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
  it('renders a semantic table with cover fallback and pagination', () => {
    render(<PostList posts={posts} />);
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getAllByText('이미지 없음')).toHaveLength(10);
    fireEvent.click(screen.getByRole('button', { name: '다음' }));
    expect(screen.getByText('2 / 2')).toBeInTheDocument();
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
