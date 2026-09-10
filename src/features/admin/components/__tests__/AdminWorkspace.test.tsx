import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AdminWorkspace } from '@features/admin/components/AdminWorkspace';

vi.mock('@features/admin/components/PostList', () => ({
  PostList: ({ posts }: { posts: Array<{ title: string }> }) => <p>목록: {posts[0]?.title}</p>,
}));
vi.mock('@features/admin/components/BlogSettings', () => ({
  BlogSettings: ({ categories }: { categories: Array<{ name: string }> }) => (
    <p>설정: {categories[0]?.name}</p>
  ),
}));

const posts = [
  {
    id: 'p1',
    title: '첫 글',
    slug: 'first',
    status: 'published' as const,
    updated_at: '2026-09-10T00:00:00.000Z',
    pin_order: null,
  },
];
const categories = [{ id: 'c1', slug: 'dev', name: '개발', sort_order: 0, is_default: false }];

describe('AdminWorkspace', () => {
  it('글 목록과 설정을 연결된 탭 패널로 전환한다', () => {
    render(<AdminWorkspace posts={posts} categories={categories} />);

    const postsTab = screen.getByRole('tab', { name: '글' });
    const settingsTab = screen.getByRole('tab', { name: '블로그 설정' });
    expect(postsTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('목록: 첫 글')).toBeVisible();

    fireEvent.click(settingsTab);
    expect(settingsTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('설정: 개발')).toBeVisible();
  });
});
