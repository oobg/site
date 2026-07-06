import { describe, expect, it } from 'vitest';
import type { PostListItem } from '@features/posts/types/posts.types';
import { getRelatedPosts } from '@features/posts/utils/related';

function post(slug: string, tags: string[], published_at: string): PostListItem {
  return {
    slug,
    title: slug,
    summary: null,
    tags,
    published_at,
    updated_at: published_at,
    cover_image_url: null,
    status: 'published',
  };
}

describe('getRelatedPosts', () => {
  const current = post('current', ['nextjs', 'architecture'], '2026-06-01T00:00:00.000Z');
  const all: PostListItem[] = [
    current,
    post('two-match', ['nextjs', 'architecture'], '2026-01-01T00:00:00.000Z'),
    post('one-match', ['nextjs', 'react'], '2026-05-01T00:00:00.000Z'),
    post('no-match-new', ['python'], '2026-07-01T00:00:00.000Z'),
    post('no-match-old', ['go'], '2025-01-01T00:00:00.000Z'),
  ];

  it('자기 자신을 제외한다', () => {
    const result = getRelatedPosts(current, all);
    expect(result.map((p) => p.slug)).not.toContain('current');
  });

  it('태그 겹침이 많은 순으로 정렬한다', () => {
    const result = getRelatedPosts(current, all, 2);
    expect(result.map((p) => p.slug)).toEqual(['two-match', 'one-match']);
  });

  it('겹침이 같으면 최신글이 우선한다', () => {
    const result = getRelatedPosts(current, all);
    // one-match(2026-05) 다음은 겹침 0 중 최신인 no-match-new(2026-07)
    expect(result[2].slug).toBe('no-match-new');
  });

  it('limit만큼만 반환한다', () => {
    expect(getRelatedPosts(current, all, 1)).toHaveLength(1);
  });

  it('겹치는 글이 없어도 최신글로 채운다', () => {
    const lonely = post('lonely', ['unique-tag'], '2026-06-01T00:00:00.000Z');
    const result = getRelatedPosts(lonely, [lonely, ...all], 3);
    expect(result).toHaveLength(3);
    expect(result.map((p) => p.slug)).not.toContain('lonely');
  });
});
