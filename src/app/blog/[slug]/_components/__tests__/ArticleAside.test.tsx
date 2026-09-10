import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ArticleAside } from '@/app/blog/[slug]/_components/ArticleAside';
import type { BlogPost } from '@features/posts/types/posts.types';

const post: BlogPost = {
  slug: 'tagged-post',
  title: '태그가 있는 글',
  summary: '요약',
  tags: ['React Query', '접근성'],
  published_at: '2026-09-10T00:00:00.000Z',
  updated_at: '2026-09-10T00:00:00.000Z',
  cover_image_url: null,
  reading_time_min: 4,
  status: 'published',
  body_markdown: '본문',
  frontmatter: {},
  category: { id: 'c', slug: 'dev', name: '개발', sort_order: 0, is_default: false },
  cover_image_key: null,
  cover_position: { x: 0.5, y: 0.5 },
  cover_alt: null,
  pin_order: null,
};

describe('ArticleAside', () => {
  it('태그를 같은 필터의 홈 목록 링크로 연결한다', () => {
    render(<ArticleAside post={post} related={[]} readingMin={4} />);

    expect(screen.getByRole('link', { name: 'React Query' })).toHaveAttribute(
      'href',
      '/?tag=React+Query',
    );
    expect(screen.getByRole('link', { name: '접근성' })).toHaveAttribute(
      'href',
      '/?tag=%EC%A0%91%EA%B7%BC%EC%84%B1',
    );
  });
});
