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
  {
    id: '20000000-0000-4000-8000-000000000001',
    slug: 'dev',
    name: '개발',
    sort_order: 1,
    is_default: false,
  },
];
const posts = [
  {
    id: '10000000-0000-4000-8000-000000000001',
    title: '첫 글',
    slug: 'first',
    status: 'published' as const,
    updated_at: '',
    created_at: '2025-01-01',
    cover_image_url: null,
    cover_alt: null,
    cover_position_x: 50,
    cover_position_y: 50,
    pin_order: 1,
    category_id: categories[0].id,
  },
  {
    id: '10000000-0000-4000-8000-000000000002',
    title: '둘째 글',
    slug: 'second',
    status: 'published' as const,
    updated_at: '',
    created_at: '2024-01-01',
    cover_image_url: null,
    cover_alt: null,
    cover_position_x: 50,
    cover_position_y: 50,
    pin_order: 2,
    category_id: categories[1].id,
  },
  {
    id: '10000000-0000-4000-8000-000000000003',
    title: '초안',
    slug: 'draft',
    status: 'draft' as const,
    updated_at: '',
    created_at: '2023-01-01',
    cover_image_url: null,
    cover_alt: null,
    cover_position_x: 50,
    cover_position_y: 50,
    pin_order: null,
    category_id: categories[0].id,
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
    expect(screen.getAllByRole('textbox', { name: '카테고리 이름' })[0]).toBeDisabled();
    expect(screen.getAllByRole('button', { name: '삭제' })[0]).toBeDisabled();
  });

  it('draft를 pin 후보에서 제외하고 이동 결과를 시각 순서와 form 순서에 반영한다', () => {
    const { container } = view();
    expect(screen.queryByText('초안')).not.toBeInTheDocument();
    expect(
      screen.getAllByRole('checkbox').map((checkbox) => checkbox.parentElement?.textContent),
    ).toEqual([expect.stringContaining('첫 글'), expect.stringContaining('둘째 글')]);
    fireEvent.click(screen.getByRole('button', { name: '둘째 글 위로' }));
    expect(container).toHaveTextContent('1.');
    expect(
      [...container.querySelectorAll('input[name="post_ids"]')].map(
        (node) => (node as HTMLInputElement).value,
      ),
    ).toEqual([posts[1].id, posts[0].id]);
  });

  it('대표 글 필터 뒤에도 선택된 글 전체를 hidden input으로 보존한다', () => {
    const { container } = view();
    fireEvent.change(screen.getByRole('combobox', { name: '대표 글 카테고리' }), {
      target: { value: categories[0].id },
    });
    expect(screen.queryByText(/둘째 글/)).not.toBeInTheDocument();
    expect(
      [...container.querySelectorAll('input[name="post_ids"]')].map(
        (node) => (node as HTMLInputElement).value,
      ),
    ).toEqual([posts[0].id, posts[1].id]);
  });
});
