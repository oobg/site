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
    fireEvent.change(screen.getByRole('searchbox', { name: '글 검색' }), {
      target: { value: '없는 글' },
    });
    expect(screen.getByText('조건에 맞는 글이 없어요.')).toBeInTheDocument();
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
