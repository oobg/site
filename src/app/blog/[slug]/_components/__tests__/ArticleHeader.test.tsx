import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ArticleHeader } from '@/app/blog/[slug]/_components/ArticleHeader';
import type { BlogPost } from '@features/posts/types/posts.types';

const post: BlogPost = {
  slug: 'test',
  title: '테스트 글',
  summary: '요약',
  tags: ['react'],
  published_at: '2026-09-10T00:00:00.000Z',
  updated_at: '2026-09-10T00:00:00.000Z',
  cover_image_url: null,
  reading_time_min: 3,
  status: 'published',
  body_markdown: '본문',
  frontmatter: {},
  category: { id: 'c', slug: 'dev', name: '개발', sort_order: 0, is_default: false },
  cover_image_key: null,
  cover_position: { x: 0.25, y: 0.75 },
  cover_alt: '표지 설명',
  pin_order: null,
};

describe('ArticleHeader', () => {
  it('shows category and author metadata without reserving empty cover space', () => {
    const { container } = render(<ArticleHeader post={post} readingMin={3} />);
    expect(screen.getByText('개발')).toBeInTheDocument();
    expect(screen.getByText('Raven')).toBeInTheDocument();
    expect(screen.getByText(/3분 읽기/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'react' })).toHaveAttribute('href', '/?tag=react');
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
  });

  it('uses the supplied cover alt and crop position', () => {
    const { container } = render(
      <ArticleHeader post={{ ...post, cover_image_url: '/cover.jpg' }} readingMin={3} />,
    );
    const image = screen.getByRole('img', { name: '표지 설명' });
    expect(image).toHaveStyle({ objectPosition: '25% 75%' });
    expect(container).not.toHaveTextContent('raven.kr');
  });
});
