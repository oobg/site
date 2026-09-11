import 'server-only';

import { dehydrate, type DehydratedState } from '@tanstack/react-query';
import { makeQueryClient } from '@configs/query-client';
import { getBlogHomeData } from '@features/posts/services/posts.api';
import {
  blogPostsQueryOptions,
  normalizeBlogPostFilters,
} from '@features/posts/services/posts.query';
import type { BlogHomeData, BlogPostFilters } from '@features/posts/types/posts.types';

export interface PrefetchedBlogHome {
  data: BlogHomeData;
  dehydratedState: DehydratedState;
}

/** Creates one QueryClient per server request and seeds the browser's exact query key. */
export async function prefetchBlogHome(filters: BlogPostFilters = {}): Promise<PrefetchedBlogHome> {
  const normalized = normalizeBlogPostFilters(filters);
  const queryClient = makeQueryClient();
  const options = blogPostsQueryOptions(normalized);
  const data = await queryClient.fetchQuery({
    ...options,
    queryFn: () => getBlogHomeData(normalized),
  });
  return { data, dehydratedState: dehydrate(queryClient) };
}
