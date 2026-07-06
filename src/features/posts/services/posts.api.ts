import 'server-only';
import { notFound } from 'next/navigation';
import { env } from '@configs/env';
import { apiGet } from '@lib/api/http';
import type { ContentListItem, ListParams } from '@lib/api/contract.types';
import type { Post } from '@features/posts/types/posts.types';
import { mockPostDetails, mockPostList } from '@features/posts/fixtures/posts.mock';

export async function getPosts(params: ListParams = {}): Promise<ContentListItem[]> {
  if (env.CONTENT_SOURCE === 'mock') {
    const items = params.tag
      ? mockPostList.filter((p) => p.tags.includes(params.tag!))
      : mockPostList;
    return typeof params.limit === 'number' ? items.slice(0, params.limit) : items;
  }
  return apiGet<ContentListItem[]>('/content/posts', {
    tags: ['posts'],
    searchParams: {
      tag: params.tag,
      page: params.page,
      limit: params.limit,
      sort: params.sort ?? '-published_at',
    },
  });
}

export async function getPost(slug: string): Promise<Post> {
  if (env.CONTENT_SOURCE === 'mock') {
    const post = mockPostDetails[slug];
    if (!post) notFound();
    return post;
  }
  return apiGet<Post>(`/content/posts/${slug}`, { tags: [`post:${slug}`] });
}
