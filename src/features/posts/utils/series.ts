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
