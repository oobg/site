import 'server-only';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { env } from '@configs/env';
import { apiGet } from '@lib/api/http';
import type { ContentListItem, ListParams } from '@lib/api/contract.types';
import type { Post } from '@features/posts/types/posts.types';
import { mockPostDetails, mockPostList } from '@features/posts/fixtures/posts.mock';
import { createPublicClient } from '@lib/supabase/public';
import { sortContentItems } from '@lib/content/sort';

interface SupabasePostRow {
  title: string;
  slug: string;
  description: string;
  status: 'draft' | 'published';
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

interface SupabasePostDetailRow extends SupabasePostRow {
  body: string;
}

const PUBLIC_POST_LIST_COLUMNS =
  'title, slug, description, status, published_at, created_at, updated_at';
const PUBLIC_POST_DETAIL_COLUMNS = `${PUBLIC_POST_LIST_COLUMNS}, body`;

function toPostListItem(row: SupabasePostRow): ContentListItem {
  return {
    slug: row.slug,
    title: row.title,
    summary: row.description || null,
    tags: [],
    published_at: row.published_at ?? row.created_at,
    updated_at: row.updated_at,
    cover_image_url: null,
    status: 'published',
  };
}

async function fetchPosts(params: ListParams): Promise<ContentListItem[]> {
  if (env.CONTENT_SOURCE === 'mock') {
    const filtered = params.tag
      ? mockPostList.filter((p) => p.tags.includes(params.tag!))
      : mockPostList;
    const sorted = sortContentItems(filtered, params.sort ?? '-published_at');
    return typeof params.limit === 'number' ? sorted.slice(0, params.limit) : sorted;
  }
  if (env.CONTENT_SOURCE === 'supabase') {
    // 현재 Supabase 스키마에는 tags가 없다. 태그 필터에는 일치하는 공개 글이 없다.
    if (params.tag) return [];

    const supabase = createPublicClient();
    const sort = params.sort ?? '-published_at';
    const descending = sort.startsWith('-');
    const column = descending ? sort.slice(1) : sort;
    let query = supabase
      .from('posts')
      .select(PUBLIC_POST_LIST_COLUMNS)
      .eq('status', 'published')
      .order(column, { ascending: !descending, nullsFirst: false });
    if (typeof params.limit === 'number') {
      const from = ((params.page ?? 1) - 1) * params.limit;
      query = query.range(from, from + params.limit - 1);
    }
    const { data, error } = await query;

    if (error) throw new Error(`공개 글 목록을 불러오지 못했습니다: ${error.message}`);
    return ((data ?? []) as SupabasePostRow[]).map(toPostListItem);
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

const getPostsCached = cache(
  (
    tag: string | undefined,
    page: number | undefined,
    limit: number | undefined,
    sort: ListParams['sort'],
  ) => fetchPosts({ tag, page, limit, sort }),
);

/** 같은 서버 렌더 안의 동일한 목록 요청을 하나로 합친다. */
export function getPosts(params: ListParams = {}): Promise<ContentListItem[]> {
  return getPostsCached(params.tag, params.page, params.limit, params.sort ?? '-published_at');
}

const getPostCached = cache(async (slug: string): Promise<Post> => {
  if (env.CONTENT_SOURCE === 'mock') {
    if (!Object.hasOwn(mockPostDetails, slug)) notFound();
    const post = mockPostDetails[slug];
    return post;
  }
  if (env.CONTENT_SOURCE === 'supabase') {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from('posts')
      .select(PUBLIC_POST_DETAIL_COLUMNS)
      .eq('status', 'published')
      .eq('slug', slug.normalize('NFC'))
      .maybeSingle();

    if (error) throw new Error(`공개 글을 불러오지 못했습니다: ${error.message}`);
    if (!data) notFound();
    const row = data as SupabasePostDetailRow;
    return { ...toPostListItem(row), body_markdown: row.body, frontmatter: {} };
  }
  return apiGet<Post>(`/content/posts/${slug}`, { tags: [`post:${slug}`] });
});

/** generateMetadata와 페이지 본문이 같은 글을 요청할 때 한 번만 읽는다. */
export function getPost(slug: string): Promise<Post> {
  return getPostCached(slug);
}
