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
  it('표지 없는 글은 요청된 목록에서만 비어 있는 1.9 자리를 보존한다', () => {
    const { container, rerender } = render(<PostCard post={post} />);
    expect(container.querySelector('[data-cover-placeholder]')).toBeNull();

    rerender(<PostCard post={post} reserveCoverSpace />);
    const placeholder = container.querySelector('[data-cover-placeholder]');
    expect(placeholder).toHaveAttribute('aria-hidden', 'true');
    expect(placeholder?.querySelector('a, img')).toBeNull();
    expect(container.querySelector('article')).toHaveAttribute('data-reserved');
    expect(container.querySelector('article')).toHaveAttribute('data-no-cover');
    expect(screen.getByRole('link', { name: '표지가 없는 글' })).toBeInTheDocument();
  });

  it('links both cover and title to the canonical category URL', () => {
    render(<PostCard post={{ ...post, cover_image_url: '/cover.jpg', slug: 'my-post' }} />);
    expect(screen.getAllByRole('link', { hidden: true })).toHaveLength(2);
    for (const link of screen.getAllByRole('link', { hidden: true })) {
      expect(link).toHaveAttribute('href', '/blog/dev/my-post');
    }
  });

  it('표지를 별도 프레임 없이 링크 안에 바로 렌더한다', () => {
    const { container } = render(
      <PostCard
        post={{ ...post, cover_image_url: '/cover.jpg', cover_position: { x: 0.25, y: 0.75 } }}
      />,
    );
    const coverLink = container.querySelector('article > a');
    const image = coverLink?.querySelector('img');

    expect(container.querySelector('[data-media-frame]')).toBeNull();
    expect(coverLink).toHaveAttribute('aria-hidden', 'true');
    expect(coverLink).toHaveAttribute('tabindex', '-1');
    expect(image).toHaveAttribute('src', '/cover.jpg');
    expect(image).toHaveAttribute('width', '760');
    expect(image).toHaveAttribute('height', '400');
    expect(image).toHaveAttribute('loading', 'lazy');
    expect(image).toHaveAttribute('decoding', 'async');
    expect(image).toHaveStyle({ objectPosition: '25% 75%' });
  });
});
