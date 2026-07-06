import type { PostListItem } from '@features/posts/types/posts.types';

/**
 * 태그 겹침 수가 많을수록, 같으면 최신일수록 우선한다.
 * 관련글 API가 없어 목록에서 유사도로 계산한다. 겹침이 0이면 최신글로 채워진다.
 */
export function getRelatedPosts(
  current: Pick<PostListItem, 'slug' | 'tags'>,
  all: PostListItem[],
  limit = 3,
): PostListItem[] {
  const currentTags = new Set(current.tags);
  return all
    .filter((post) => post.slug !== current.slug)
    .map((post) => ({
      post,
      score: post.tags.reduce((n, tag) => (currentTags.has(tag) ? n + 1 : n), 0),
    }))
    .sort((a, b) =>
      b.score !== a.score
        ? b.score - a.score
        : b.post.published_at.localeCompare(a.post.published_at),
    )
    .slice(0, limit)
    .map((entry) => entry.post);
}
