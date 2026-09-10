import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PostList } from '@features/admin/components/PostList';

describe('PostList', () => {
  it('빈 목록에서도 필터와 테이블 구조를 유지한다', () => {
    render(<PostList posts={[]} />);
    expect(screen.getByLabelText('글 상태')).toBeVisible();
    expect(screen.getByRole('searchbox', { name: '제목 검색' })).toBeVisible();
    expect(screen.getByRole('list', { name: '글 목록' })).toHaveTextContent(
      '아직 작성한 글이 없어요',
    );
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
      [...screen.getByRole('list', { name: '글 목록' }).querySelectorAll('time')].map((node) =>
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
