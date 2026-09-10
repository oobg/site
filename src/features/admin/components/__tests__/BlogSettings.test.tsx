import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@features/admin/services/categories.actions', () => ({
  createCategoryAction: vi.fn(),
  updateCategoryAction: vi.fn(),
  deleteCategoryAction: vi.fn(),
  reorderPinnedPostsAction: vi.fn(),
}));
import { BlogSettings } from '@features/admin/components/BlogSettings';

const categories = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    slug: 'uncategorized',
    name: '미분류',
    sort_order: 99,
    is_default: true,
  },
];
const posts = [
  {
    id: '10000000-0000-4000-8000-000000000001',
    title: '첫 글',
    slug: 'first',
    status: 'published' as const,
    updated_at: '',
    pin_order: 1,
  },
  {
    id: '10000000-0000-4000-8000-000000000002',
    title: '둘째 글',
    slug: 'second',
    status: 'published' as const,
    updated_at: '',
    pin_order: 2,
  },
  {
    id: '10000000-0000-4000-8000-000000000003',
    title: '초안',
    slug: 'draft',
    status: 'draft' as const,
    updated_at: '',
    pin_order: null,
  },
];

function view() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <BlogSettings categories={categories} posts={posts} />
    </QueryClientProvider>,
  );
}

describe('BlogSettings', () => {
  it('기본 카테고리의 변경과 삭제를 막는다', () => {
    view();
    expect(screen.getByRole('textbox', { name: '카테고리 이름' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '삭제' })).toBeDisabled();
  });

  it('draft를 pin 후보에서 제외하고 이동 결과를 시각 순서와 form 순서에 반영한다', () => {
    const { container } = view();
    expect(screen.queryByText('초안')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '둘째 글 위로' }));
    expect(screen.getByText(/1\. 둘째 글/)).toBeInTheDocument();
    expect(
      [...container.querySelectorAll('input[name="post_ids"]')].map(
        (node) => (node as HTMLInputElement).value,
      ),
    ).toEqual([posts[1].id, posts[0].id]);
  });
});
