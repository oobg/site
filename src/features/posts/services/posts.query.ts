import { queryOptions } from '@tanstack/react-query';
import type { BlogHomeData, BlogPostFilters, Post } from '@features/posts/types/posts.types';

export const BLOG_QUERY_STALE_TIME = 60 * 1000;

export interface NormalizedBlogPostFilters {
  q: string;
  category: string;
  tag: string;
  page: number;
  pageSize: number;
}

export function normalizeBlogPostFilters(filters: BlogPostFilters = {}): NormalizedBlogPostFilters {
  return {
    q: filters.q?.trim() ?? '',
    category: filters.category?.trim().toLocaleLowerCase('en-US') ?? '',
    tag: filters.tag?.trim().toLocaleLowerCase('ko-KR') ?? '',
    page:
      typeof filters.page === 'number' && Number.isFinite(filters.page) && filters.page >= 1
        ? Math.trunc(filters.page)
        : 1,
    pageSize:
      typeof filters.pageSize === 'number' &&
      Number.isFinite(filters.pageSize) &&
      filters.pageSize >= 1
        ? Math.min(100, Math.trunc(filters.pageSize))
        : 12,
  };
}

export function blogPostsQueryKey(filters: BlogPostFilters = {}) {
  const normalized = normalizeBlogPostFilters(filters);
  return [
    'blog-posts',
    normalized.q,
    normalized.category,
    normalized.tag,
    normalized.page,
    normalized.pageSize,
  ] as const;
}

async function fetchBlogPosts(
  filters: BlogPostFilters,
  signal?: AbortSignal,
): Promise<BlogHomeData> {
  const normalized = normalizeBlogPostFilters(filters);
  const params = new URLSearchParams();
  if (normalized.q) params.set('q', normalized.q);
  if (normalized.category) params.set('category', normalized.category);
  if (normalized.tag) params.set('tag', normalized.tag);
  params.set('page', String(normalized.page));
  params.set('pageSize', String(normalized.pageSize));

  const response = await fetch(`/api/posts?${params}`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
    signal,
  });
  if (!response.ok) throw new Error('공개 글을 불러오지 못했습니다.');
  return response.json() as Promise<BlogHomeData>;
}

export function blogPostsQueryOptions(filters: BlogPostFilters = {}) {
  const normalized = normalizeBlogPostFilters(filters);
  return queryOptions({
    queryKey: blogPostsQueryKey(normalized),
    queryFn: ({ signal }) => fetchBlogPosts(normalized, signal),
    staleTime: BLOG_QUERY_STALE_TIME,
  });
}

export function postQueryOptions(slug: string) {
  const normalizedSlug = slug.normalize('NFC');
  return queryOptions<Post>({
    queryKey: ['post', normalizedSlug],
    queryFn: async ({ signal }) => {
      const response = await fetch(`/api/posts/${encodeURIComponent(normalizedSlug)}`, {
        cache: 'no-store',
        signal,
      });
      if (!response.ok) throw new Error('공개 글을 불러오지 못했습니다.');
      return response.json() as Promise<Post>;
    },
    staleTime: BLOG_QUERY_STALE_TIME,
  });
}
