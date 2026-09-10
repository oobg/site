import type { PostListItem } from '@features/posts/types/posts.types';
import { parsePostSeriesPosition } from '@features/posts/utils/series';

/**
 * 같은 연재면 현재 편에서 가까운 순서로 먼저 놓는다. 거리가 같으면 이전 편이 먼저다.
 * 연재 밖 후보는 태그 겹침 수, 최신 발행일, slug 순으로 안정적으로 채운다.
 */
export function getRelatedPosts(
  current: Pick<PostListItem, 'slug' | 'tags'>,
  all: PostListItem[],
  limit = 3,
): PostListItem[] {
  const currentTags = new Set(current.tags);
  const currentSeries = parsePostSeriesPosition(current.slug);
  return all
    .filter((post) => post.slug !== current.slug)
    .map((post) => ({
      post,
      score: post.tags.reduce((n, tag) => (currentTags.has(tag) ? n + 1 : n), 0),
      position: parsePostSeriesPosition(post.slug),
    }))
    .sort((a, b) => {
      const aSameSeries = Boolean(currentSeries && a.position?.series === currentSeries.series);
      const bSameSeries = Boolean(currentSeries && b.position?.series === currentSeries.series);
      if (aSameSeries !== bSameSeries) return aSameSeries ? -1 : 1;

      if (aSameSeries && bSameSeries && currentSeries && a.position && b.position) {
        const aDelta = a.position.number - currentSeries.number;
        const bDelta = b.position.number - currentSeries.number;
        const byDistance = Math.abs(aDelta) - Math.abs(bDelta);
        if (byDistance) return byDistance;
        if (aDelta < 0 !== bDelta < 0) return aDelta < 0 ? -1 : 1;
        const byNumber = a.position.number - b.position.number;
        if (byNumber) return byNumber;
      }

      if (b.score !== a.score) return b.score - a.score;
      const byDate = b.post.published_at.localeCompare(a.post.published_at);
      return byDate || a.post.slug.localeCompare(b.post.slug);
    })
    .slice(0, limit)
    .map((entry) => entry.post);
}
