import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RecentPosts } from '@/app/_components/RecentPosts';
import type { PostListItem } from '@features/posts/types/posts.types';

function makePost(slug: string, title: string): PostListItem {
  return {
    slug,
    title,
    summary: '요약',
    tags: ['nextjs'],
    published_at: '2026-06-24T00:00:00.000Z',
    updated_at: '2026-07-01T00:00:00.000Z',
    cover_image_url: null,
    status: 'published',
  };
}

describe('RecentPosts', () => {
  it('글 목록과 상세 링크를 렌더한다', () => {
    render(<RecentPosts posts={[makePost('a', '첫 글'), makePost('b', '둘째 글')]} />);
    expect(screen.getByText('첫 글')).toHaveAttribute('href', '/blog/a');
    expect(screen.getByText('둘째 글')).toHaveAttribute('href', '/blog/b');
  });

  it('글이 없으면 섹션 자체를 렌더하지 않는다', () => {
    const { container } = render(<RecentPosts posts={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('글이 하나뿐이어도 성립한다', () => {
    // 피처드 한 편을 따로 세우던 구조에서는 이 경우 목록이 비었다.
    const { container } = render(<RecentPosts posts={[makePost('a', '유일한 글')]} />);
    expect(container.querySelectorAll('li')).toHaveLength(1);
    expect(screen.getByText('유일한 글')).toBeInTheDocument();
  });
});
