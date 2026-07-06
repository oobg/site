import { queryOptions } from '@tanstack/react-query';
import type { ListParams } from '@lib/api/contract.types';
import { getPost, getPosts } from '@features/posts/services/posts.api';

export function postsQueryOptions(params: ListParams = {}) {
  return queryOptions({ queryKey: ['posts', params], queryFn: () => getPosts(params) });
}

export function postQueryOptions(slug: string) {
  return queryOptions({ queryKey: ['post', slug], queryFn: () => getPost(slug) });
}
