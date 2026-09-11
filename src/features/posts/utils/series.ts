import type { PostListItem } from '@features/posts/types/posts.types';

export interface PostSeriesPosition {
  series: string;
  number: number;
}

const PUBLISHED_SERIES = ['design-system', 'ai-memory'] as const;

/** `series-name-01-title`처럼 slug에 명시된 연재 번호만 읽는다. */
export function parsePostSeriesPosition(slug: string): PostSeriesPosition | null {
  const normalized = slug.normalize('NFC');
  const series = PUBLISHED_SERIES.find((candidate) => normalized.startsWith(`${candidate}-`));
  if (!series) return null;
  const match = new RegExp(`^${series}-(\\d{2})(?:-|$)`).exec(normalized);
  if (!match) return null;
  const number = Number(match[1]);
  if (!Number.isSafeInteger(number)) return null;
  return { series, number };
}

/** 연재 번호가 있는 글은 시리즈와 편 번호순, 나머지는 발행일·slug순으로 정렬한다. */
export function comparePostSeriesOrder(a: PostListItem, b: PostListItem): number {
  const left = parsePostSeriesPosition(a.slug);
  const right = parsePostSeriesPosition(b.slug);

  if (left && right) {
    const bySeries = left.series.localeCompare(right.series, 'en');
    if (bySeries) return bySeries;
    const byNumber = left.number - right.number;
    if (byNumber) return byNumber;
  } else if (left || right) {
    return left ? -1 : 1;
  }

  const byDate = Date.parse(a.published_at) - Date.parse(b.published_at);
  return byDate || a.slug.localeCompare(b.slug);
}

export interface AdjacentPosts {
  prev: PostListItem | null;
  next: PostListItem | null;
}

/** 연재 글은 같은 시리즈의 편 번호를, 일반 글은 발행일을 기준으로 앞뒤 글을 찾는다. */
export function getAdjacentPosts(current: PostListItem, posts: PostListItem[]): AdjacentPosts {
  const position = parsePostSeriesPosition(current.slug);

  if (position) {
    const seriesPosts = posts
      .filter((post) => parsePostSeriesPosition(post.slug)?.series === position.series)
      .sort(comparePostSeriesOrder);
    const index = seriesPosts.findIndex((post) => post.slug === current.slug);
    if (index < 0) return { prev: null, next: null };
    return {
      prev: index > 0 ? seriesPosts[index - 1] : null,
      next: index < seriesPosts.length - 1 ? seriesPosts[index + 1] : null,
    };
  }

  const newestFirst = [...posts].sort((a, b) => {
    const byDate = Date.parse(b.published_at) - Date.parse(a.published_at);
    return byDate || a.slug.localeCompare(b.slug);
  });
  const index = newestFirst.findIndex((post) => post.slug === current.slug);
  if (index < 0) return { prev: null, next: null };
  return {
    prev: index < newestFirst.length - 1 ? newestFirst[index + 1] : null,
    next: index > 0 ? newestFirst[index - 1] : null,
  };
}
