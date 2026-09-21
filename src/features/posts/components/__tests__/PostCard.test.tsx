import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PostCard } from '@features/posts/components/PostCard';
import type { BlogPostSummary } from '@features/posts/types/posts.types';

const post: BlogPostSummary = {
  slug: 'plain-post',
  title: '표지가 없는 글',
  summary: '요약',
  tags: [],
  published_at: '2026-09-10T00:00:00.000Z',
  updated_at: '2026-09-10T00:00:00.000Z',
  cover_image_url: null,
  reading_time_min: 2,
  status: 'published',
  category: { id: 'c', slug: 'dev', name: '개발', sort_order: 0, is_default: false },
  cover_image_key: null,
  cover_position: { x: 0.5, y: 0.5 },
  cover_alt: null,
  pin_order: null,
};

describe('PostCard', () => {
  it('표지 없는 글은 가짜 미디어 없이 여백과 선으로 자리를 보존한다', () => {
    const { container, rerender } = render(<PostCard post={post} />);
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull();

    rerender(<PostCard post={post} reserveCoverSpace />);
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull();
    expect(container.querySelector('article')).toHaveAttribute('data-reserved');
    expect(container.querySelector('article')).toHaveAttribute('data-no-cover');
    expect(screen.getByRole('link', { name: '표지가 없는 글' })).toBeInTheDocument();
  });
});
