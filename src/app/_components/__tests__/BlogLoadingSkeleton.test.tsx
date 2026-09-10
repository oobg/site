import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import {
  BlogArchiveSkeleton,
  BlogArticleDataSkeleton,
  BlogArticleSkeleton,
  BlogHomeSkeleton,
} from '@/app/_components/BlogLoadingSkeleton';

const post = {
  slug: 'loading-post',
  title: '데이터를 확보한 글',
  summary: '실제 헤더를 유지해요.',
  body_markdown: '# 본문',
  tags: ['loading'],
  published_at: '2026-09-10T00:00:00.000Z',
  updated_at: '2026-09-10T00:00:00.000Z',
  cover_image_url: null,
  cover_image_key: null,
  cover_alt: null,
  cover_position: { x: 0.5, y: 0.5 },
  reading_time_min: 1,
  status: 'published' as const,
  pin_order: null,
  category: {
    id: 'category',
    name: '개발',
    slug: 'dev',
    sort_order: 1,
    is_default: false,
  },
  frontmatter: {},
};

describe('BlogLoadingSkeleton', () => {
  it('홈의 sidebar와 세 카드 열 자리를 함께 유지한다', () => {
    const { container } = render(<BlogHomeSkeleton />);
    expect(container.querySelector('[aria-busy]')).toHaveAttribute('aria-label', '불러오는 중');
    expect(container.querySelector('aside')).not.toBeNull();
    expect(container.querySelectorAll('article')).toHaveLength(3);
  });

  it('상세 글의 shell과 article 읽기 열 자리를 함께 유지한다', () => {
    const { container } = render(<BlogArticleSkeleton />);
    expect(container.querySelector('aside')).not.toBeNull();
    expect(container.querySelector('article')).not.toBeNull();
  });

  it('검색과 필터 결과의 archive 카드 열 자리를 유지한다', () => {
    const { container } = render(<BlogArchiveSkeleton />);
    expect(container.querySelector('[aria-label="글 목록을 불러오는 중"]')).toHaveAttribute(
      'aria-busy',
      'true',
    );
    expect(container.querySelectorAll('article')).toHaveLength(6);
  });

  it('글 데이터 확보 뒤 실제 no-cover header를 본문 skeleton과 함께 유지한다', () => {
    const { container } = render(
      <BlogArticleDataSkeleton
        post={post}
        categories={[{ ...post.category, post_count: 1 }]}
        readingMin={1}
        toc={[{ id: '본문', text: '본문', depth: 2 }]}
      />,
    );
    expect(container.querySelector('[aria-label="글 본문을 불러오는 중"]')).toHaveAttribute(
      'aria-busy',
      'true',
    );
    expect(container.querySelector('header img')).toBeNull();
  });
});
