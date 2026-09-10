import { describe, expect, it } from 'vitest';
import type { BlogCategory, BlogPostSelectionCandidate } from '@features/posts/types/posts.types';
import { filterAndPaginatePosts, selectFeaturedPosts } from '@features/posts/utils/blog-posts';

const categories: Record<string, BlogCategory> = {
  engineering: {
    id: 'category-engineering',
    slug: 'engineering',
    name: '개발',
    sort_order: 1,
    is_default: false,
  },
  design: {
    id: 'category-design',
    slug: 'design',
    name: '디자인',
    sort_order: 2,
    is_default: false,
  },
  empty: {
    id: 'category-empty',
    slug: 'empty',
    name: '빈 카테고리',
    sort_order: 3,
    is_default: false,
  },
};

function post(
  slug: string,
  published_at: string,
  category: BlogCategory = categories.engineering,
  options: Partial<BlogPostSelectionCandidate> = {},
): BlogPostSelectionCandidate {
  return {
    slug,
    title: slug,
    summary: `${slug} 요약`,
    tags: [],
    published_at,
    updated_at: published_at,
    cover_image_url: null,
    status: 'published',
    category,
    cover_image_key: null,
    cover_position: { x: 0.5, y: 0.5 },
    cover_alt: null,
    pin_order: null,
    ...options,
  };
}

describe('selectFeaturedPosts', () => {
  it('공개 고정 글이 있으면 자동 후보와 draft 고정 글을 섞지 않는다', () => {
    const result = selectFeaturedPosts([
      post('auto-newest', '2026-09-10T00:00:00Z'),
      post('pin-two', '2026-01-01T00:00:00Z', categories.design, { pin_order: 2 }),
      post('pin-one', '2025-01-01T00:00:00Z', categories.engineering, { pin_order: 1 }),
      post('draft-pin', '2026-12-01T00:00:00Z', categories.design, {
        status: 'draft',
        pin_order: 3,
      }),
    ]);

    expect(result.map(({ slug }) => slug)).toEqual(['pin-one', 'pin-two']);
  });

  it('고정 글이 없으면 카테고리별 최신 글 하나만 고르고 날짜 동률은 slug로 푼다', () => {
    const result = selectFeaturedPosts([
      post('engineering-old', '2026-08-01T00:00:00Z'),
      post('z-design', '2026-09-10T00:00:00Z', categories.design),
      post('a-engineering', '2026-09-10T00:00:00Z'),
    ]);

    expect(result.map(({ slug }) => slug)).toEqual(['a-engineering', 'z-design']);
  });

  it('공개 글이나 채워진 카테고리가 없으면 빈 결과를 반환하고 최대 5개로 제한한다', () => {
    expect(selectFeaturedPosts([])).toEqual([]);
    expect(
      selectFeaturedPosts(
        Array.from({ length: 7 }, (_, index) =>
          post(`post-${index}`, `2026-09-0${index + 1}T00:00:00Z`, {
            ...categories.engineering,
            id: `category-${index}`,
          }),
        ),
      ),
    ).toHaveLength(5);
  });
});

describe('filterAndPaginatePosts', () => {
  const posts = [
    post('same-b', '2026-09-10T00:00:00Z', categories.engineering, { tags: ['React'] }),
    post('same-a', '2026-09-10T00:00:00Z', categories.engineering, { tags: ['TypeScript'] }),
    post('design', '2026-09-09T00:00:00Z', categories.design, {
      title: '좋은 화면',
      tags: ['React'],
    }),
    post('draft', '2026-09-11T00:00:00Z', categories.design, { status: 'draft' }),
  ];

  it('archive에 대표 후보를 포함하고 날짜 동률을 slug 오름차순으로 정렬한다', () => {
    expect(filterAndPaginatePosts(posts).items.map(({ slug }) => slug)).toEqual([
      'same-a',
      'same-b',
      'design',
    ]);
  });

  it('검색·카테고리·태그를 함께 적용하고 대소문자를 구분하지 않는다', () => {
    const result = filterAndPaginatePosts(posts, {
      q: '화면',
      category: 'DESIGN',
      tag: 'react',
    });
    expect(result.items.map(({ slug }) => slug)).toEqual(['design']);
  });

  it('자유 태그는 q 부분검색에 섞지 않고 tag 필터로만 찾는다', () => {
    expect(filterAndPaginatePosts(posts, { q: 'typescript' }).items).toEqual([]);
    expect(
      filterAndPaginatePosts(posts, { tag: 'typescript' }).items.map(({ slug }) => slug),
    ).toEqual(['same-a']);
  });

  it('페이지 경계와 빈 페이지 메타데이터를 안정적으로 계산한다', () => {
    const second = filterAndPaginatePosts(posts, { page: 2, pageSize: 2 });
    expect(second.items.map(({ slug }) => slug)).toEqual(['design']);
    expect(second).toMatchObject({ page: 2, pageSize: 2, totalItems: 3, totalPages: 2 });

    expect(filterAndPaginatePosts([], { page: 4, pageSize: 2 })).toEqual({
      items: [],
      page: 4,
      pageSize: 2,
      totalItems: 0,
      totalPages: 0,
    });

    expect(filterAndPaginatePosts(posts, { page: Number.NaN, pageSize: Infinity })).toMatchObject({
      page: 1,
      pageSize: 12,
    });
  });
});
