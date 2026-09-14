import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PostNav } from '@/app/blog/[slug]/_components/PostNav';
import type { PostListItem } from '@features/posts/types/posts.types';

const post = (slug: string, title: string): PostListItem => ({
  slug,
  title,
  summary: null,
  tags: [],
  published_at: '2026-09-10T00:00:00.000Z',
  updated_at: '2026-09-10T00:00:00.000Z',
  cover_image_url: null,
  reading_time_min: 3,
  status: 'published',
});

describe('PostNav', () => {
  it('글 목록과 이전·다음 글을 하나의 탐색 영역으로 렌더한다', () => {
    render(<PostNav prev={post('prev', '이전 제목')} next={post('next', '다음 제목')} />);

    const navigation = screen.getByRole('navigation', { name: '이전·다음 글' });
    expect(within(navigation).getByRole('link', { name: '글 목록' })).toHaveAttribute(
      'href',
      '/blog',
    );
    expect(within(navigation).getByRole('link', { name: /이전 글.*이전 제목/ })).toHaveAttribute(
      'href',
      '/blog/prev',
    );
    expect(within(navigation).getByRole('link', { name: /다음 글.*다음 제목/ })).toHaveAttribute(
      'href',
      '/blog/next',
    );
  });

  it('이동할 글이 없으면 탐색 영역을 렌더하지 않는다', () => {
    const { container } = render(<PostNav prev={null} next={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
