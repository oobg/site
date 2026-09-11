import { describe, expect, it } from 'vitest';
import { getAdjacentPosts, parsePostSeriesPosition } from '@features/posts/utils/series';
import type { PostListItem } from '@features/posts/types/posts.types';

const post = (slug: string, published_at = '2026-09-10T00:00:00.000Z'): PostListItem => ({
  slug,
  title: slug,
  summary: null,
  tags: [],
  published_at,
  updated_at: published_at,
  cover_image_url: null,
  status: 'published',
});

describe('parsePostSeriesPosition', () => {
  it('실제 연재 slug의 시리즈와 편 번호를 읽는다', () => {
    expect(parsePostSeriesPosition('design-system-00-prologue')).toEqual({
      series: 'design-system',
      number: 0,
    });
    expect(parsePostSeriesPosition('ai-memory-06-future')).toEqual({
      series: 'ai-memory',
      number: 6,
    });
  });

  it('번호가 명시되지 않은 slug를 추측하지 않는다', () => {
    expect(parsePostSeriesPosition('design-system-prologue')).toBeNull();
    expect(parsePostSeriesPosition('design-system-article-css-03')).toBeNull();
    expect(parsePostSeriesPosition('release-2026-post')).toBeNull();
  });
});

describe('getAdjacentPosts', () => {
  const series = [
    post('design-system-09-last'),
    post('ai-memory-01-start'),
    post('design-system-02-second'),
    post('design-system-00-prologue'),
    post('design-system-01-first'),
  ];

  it('연재 첫 편과 마지막 편의 경계를 같은 시리즈 안에서 찾는다', () => {
    expect(getAdjacentPosts(series[3], series)).toEqual({ prev: null, next: series[4] });
    expect(getAdjacentPosts(series[0], series)).toEqual({ prev: series[2], next: null });
  });

  it('중간 편은 번호 오름차순으로 연결하고 빠진 번호는 건너뛴다', () => {
    expect(getAdjacentPosts(series[4], series)).toEqual({ prev: series[3], next: series[2] });
    expect(getAdjacentPosts(series[2], series)).toEqual({ prev: series[4], next: series[0] });
  });

  it('목록에 현재 글이 없으면 다른 시리즈 글을 연결하지 않는다', () => {
    expect(getAdjacentPosts(post('design-system-03-missing'), series)).toEqual({
      prev: null,
      next: null,
    });
  });

  it('비연재 글은 기존 발행일 기준 탐색을 유지한다', () => {
    const old = post('notes-old', '2026-09-01T00:00:00.000Z');
    const current = post('notes-current', '2026-09-02T00:00:00.000Z');
    const recent = post('notes-recent', '2026-09-03T00:00:00.000Z');
    expect(getAdjacentPosts(current, [old, recent, current])).toEqual({ prev: old, next: recent });
  });
});
