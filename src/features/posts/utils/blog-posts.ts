import type {
  BlogPostFilters,
  BlogPostSelectionCandidate,
  BlogPostSummary,
  PaginatedBlogPosts,
} from '@features/posts/types/posts.types';
import { comparePostSeriesOrder } from '@features/posts/utils/series';

const MAX_FEATURED_POSTS = 5;

function compareNewest(a: BlogPostSummary, b: BlogPostSummary): number {
  const byDate = Date.parse(b.published_at) - Date.parse(a.published_at);
  return byDate || a.slug.localeCompare(b.slug);
}

function positiveInteger(value: number | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 1
    ? Math.trunc(value)
    : fallback;
}

function publicPosts(posts: readonly BlogPostSelectionCandidate[]): BlogPostSummary[] {
  return posts.filter((post): post is BlogPostSummary => post.status === 'published');
}

/**
 * 고정 글이 하나라도 있으면 고정 글만 사용한다. 없으면 카테고리마다 최신 글
 * 하나를 뽑은 뒤 전체 최신순으로 정렬한다.
 */
export function selectFeaturedPosts(
  posts: readonly BlogPostSelectionCandidate[],
  limit = MAX_FEATURED_POSTS,
): BlogPostSummary[] {
  const boundedLimit = Math.max(0, Math.min(MAX_FEATURED_POSTS, Math.trunc(limit)));
  const published = publicPosts(posts);
  const pinned = published.filter((post) => post.pin_order !== null);

  if (pinned.length > 0) {
    return pinned
      .sort(
        (a, b) =>
          (a.pin_order ?? Number.MAX_SAFE_INTEGER) - (b.pin_order ?? Number.MAX_SAFE_INTEGER) ||
          compareNewest(a, b),
      )
      .slice(0, boundedLimit);
  }

  const newestByCategory = new Map<string, BlogPostSummary>();
  for (const post of published) {
    const selected = newestByCategory.get(post.category.id);
    if (!selected || compareNewest(post, selected) < 0) {
      newestByCategory.set(post.category.id, post);
    }
  }

  return [...newestByCategory.values()].sort(compareNewest).slice(0, boundedLimit);
}

/** 최신 글 archive는 대표 글을 제외하지 않고 전체 공개 글을 안정적으로 정렬한다. */
export function filterAndPaginatePosts(
  posts: readonly BlogPostSelectionCandidate[],
  filters: BlogPostFilters = {},
): PaginatedBlogPosts {
  const q = filters.q?.trim().toLocaleLowerCase('ko-KR') ?? '';
  const category = filters.category?.trim().toLocaleLowerCase('en-US') ?? '';
  const tag = filters.tag?.trim().toLocaleLowerCase('ko-KR') ?? '';
  const page = positiveInteger(filters.page, 1);
  const pageSize = positiveInteger(filters.pageSize, 12);

  const filtered = publicPosts(posts)
    .filter((post) => !category || post.category.slug.toLocaleLowerCase('en-US') === category)
    .filter(
      (post) => !tag || post.tags.some((postTag) => postTag.toLocaleLowerCase('ko-KR') === tag),
    )
    .filter((post) => {
      if (!q) return true;
      return [post.title, post.summary ?? ''].join('\n').toLocaleLowerCase('ko-KR').includes(q);
    })
    .sort(category ? comparePostSeriesOrder : compareNewest);

  const totalItems = filtered.length;
  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize);
  const offset = (page - 1) * pageSize;

  return {
    items: filtered.slice(offset, offset + pageSize),
    page,
    pageSize,
    totalItems,
    totalPages,
  };
}
