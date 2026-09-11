'use client';

import { useQuery } from '@tanstack/react-query';
import type { BlogPostFilters } from '@features/posts/types/posts.types';
import { blogPostsQueryOptions } from '@features/posts/services/posts.query';

export function useBlogPosts(filters: BlogPostFilters = {}) {
  return useQuery(blogPostsQueryOptions(filters));
}
