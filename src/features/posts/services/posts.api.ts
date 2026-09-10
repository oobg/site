import 'server-only';
import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { notFound } from 'next/navigation';
import { env } from '@configs/env';
import { apiGet } from '@lib/api/http';
import type { ContentListItem, ListParams } from '@lib/api/contract.types';
import {
  DEFAULT_POST_CATEGORY_ID,
  DEFAULT_POST_CATEGORY_SLUG,
  type BlogCategory,
  type BlogCategoryWithCount,
  type BlogHomeData,
  type BlogPost,
  type BlogPostFilters,
  type BlogPostSummary,
  type Post,
} from '@features/posts/types/posts.types';
import { mockPostDetails, mockPostList } from '@features/posts/fixtures/posts.mock';
import { createPublicClient } from '@lib/supabase/public';
import { sortContentItems } from '@lib/content/sort';
import { filterAndPaginatePosts, selectFeaturedPosts } from '@features/posts/utils/blog-posts';
import { normalizeBlogPostFilters } from '@features/posts/services/posts.query';

interface SupabasePostRow {
  title: string;
  slug: string;
  description: string;
  status: 'draft' | 'published';
  published_at: string | null;
  created_at: string;
  updated_at: string;
  tags?: string[];
  cover_image_url?: string | null;
}

interface SupabasePostDetailRow extends SupabasePostRow {
  body: string;
}

const PUBLIC_POST_LIST_COLUMNS =
  'title, slug, description, status, published_at, created_at, updated_at, tags, cover_image_url';
const PUBLIC_POST_DETAIL_COLUMNS = `${PUBLIC_POST_LIST_COLUMNS}, body`;

function toPostListItem(row: SupabasePostRow): ContentListItem {
  return {
    slug: row.slug,
    title: row.title,
    summary: row.description || null,
    tags: row.tags ?? [],
    published_at: row.published_at ?? row.created_at,
    updated_at: row.updated_at,
    cover_image_url: row.cover_image_url ?? null,
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
    const supabase = createPublicClient();
    const sort = params.sort ?? '-published_at';
    const descending = sort.startsWith('-');
    const column = descending ? sort.slice(1) : sort;
    let query = supabase
      .from('posts')
      .select(PUBLIC_POST_LIST_COLUMNS)
      .eq('status', 'published')
      .order(column, { ascending: !descending, nullsFirst: false });
    if (params.tag) query = query.contains('tags', [params.tag.toLocaleLowerCase('ko-KR')]);
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

const getPostsFromServerCache = unstable_cache(
  (
    sourceIdentity: string,
    tag: string | undefined,
    page: number | undefined,
    limit: number | undefined,
    sort: ListParams['sort'],
  ) => {
    void sourceIdentity;
    return fetchPosts({ tag, page, limit, sort });
  },
  ['legacy-public-post-list-v1'],
  { revalidate: 60, tags: ['posts'] },
);

const getPostsCached = cache(
  (
    sourceIdentity: string,
    tag: string | undefined,
    page: number | undefined,
    limit: number | undefined,
    sort: ListParams['sort'],
  ) => getPostsFromServerCache(sourceIdentity, tag, page, limit, sort),
);

/** 같은 서버 렌더 안의 동일한 목록 요청을 하나로 합친다. */
export function getPosts(params: ListParams = {}): Promise<ContentListItem[]> {
  const sourceIdentity =
    env.CONTENT_SOURCE === 'api'
      ? `api:${env.CONTENT_API_BASE}`
      : env.CONTENT_SOURCE === 'supabase'
        ? `supabase:${process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''}`
        : 'mock';
  return getPostsCached(
    sourceIdentity,
    params.tag,
    params.page,
    params.limit,
    params.sort ?? '-published_at',
  );
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
  if (slug === '.' || slug === '..') notFound();
  return apiGet<Post>(`/content/posts/${encodeURIComponent(slug)}`, { tags: [`post:${slug}`] });
});

/** generateMetadata와 페이지 본문이 같은 글을 요청할 때 한 번만 읽는다. */
export function getPost(slug: string): Promise<Post> {
  return getPostCached(slug);
}

interface SupabaseCategoryRow {
  id: string;
  slug: string;
  name: string;
  sort_order: number;
  is_default: boolean;
  posts?: Array<{ count: number }>;
}

interface SupabaseBlogPostRow extends SupabasePostRow {
  tags: string[];
  cover_image_key: string | null;
  cover_image_url: string | null;
  cover_position_x: number;
  cover_position_y: number;
  cover_alt: string | null;
  pin_order: number | null;
  category: SupabaseCategoryRow | SupabaseCategoryRow[];
}

const DEFAULT_CATEGORY: BlogCategory = {
  id: DEFAULT_POST_CATEGORY_ID,
  slug: DEFAULT_POST_CATEGORY_SLUG,
  name: '미분류',
  sort_order: 2147483647,
  is_default: true,
};

const PUBLIC_BLOG_POST_COLUMNS = [
  'title',
  'slug',
  'description',
  'status',
  'published_at',
  'created_at',
  'updated_at',
  'tags',
  'cover_image_key',
  'cover_image_url',
  'cover_position_x',
  'cover_position_y',
  'cover_alt',
  'pin_order',
  'category:post_categories!inner(id,slug,name,sort_order,is_default)',
].join(',');

function toBlogPostSummary(row: SupabaseBlogPostRow): BlogPostSummary {
  const category = Array.isArray(row.category) ? row.category[0] : row.category;
  return {
    slug: row.slug,
    title: row.title,
    summary: row.description || null,
    tags: row.tags ?? [],
    published_at: row.published_at ?? row.created_at,
    updated_at: row.updated_at,
    cover_image_url:
      row.cover_image_url ??
      (row.cover_image_key ? `/${row.cover_image_key.replace(/^\/+/, '')}` : null),
    status: 'published',
    category: category ?? DEFAULT_CATEGORY,
    cover_image_key: row.cover_image_key,
    cover_position: { x: row.cover_position_x, y: row.cover_position_y },
    cover_alt: row.cover_alt,
    pin_order: row.pin_order,
  };
}

function legacyToBlogPostSummary(item: ContentListItem): BlogPostSummary {
  return {
    ...item,
    category: DEFAULT_CATEGORY,
    cover_image_key: null,
    cover_position: { x: 0.5, y: 0.5 },
    cover_alt: item.title,
    pin_order: null,
  };
}

async function getSupabaseBlogShellUncached(): Promise<
  Pick<BlogHomeData, 'featured' | 'categories' | 'sections'>
> {
  const supabase = createPublicClient();
  const categoriesPromise = supabase
    .from('post_categories')
    .select('id,slug,name,sort_order,is_default,posts(count)')
    .order('sort_order', { ascending: true })
    .order('slug', { ascending: true });

  const pinnedPromise = supabase
    .from('posts')
    .select(PUBLIC_BLOG_POST_COLUMNS)
    .eq('status', 'published')
    .not('pin_order', 'is', null)
    .order('pin_order', { ascending: true })
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('slug', { ascending: true })
    .limit(5);

  const [categoriesResult, pinnedResult] = await Promise.all([categoriesPromise, pinnedPromise]);
  if (categoriesResult.error)
    throw new Error(`카테고리를 불러오지 못했습니다: ${categoriesResult.error.message}`);
  if (pinnedResult.error)
    throw new Error(`대표 글을 불러오지 못했습니다: ${pinnedResult.error.message}`);

  const categories = ((categoriesResult.data ?? []) as SupabaseCategoryRow[])
    .map((category): BlogCategoryWithCount => ({
      id: category.id,
      slug: category.slug,
      name: category.name,
      sort_order: category.sort_order,
      is_default: category.is_default,
      post_count: category.posts?.[0]?.count ?? 0,
    }))
    .filter((category) => category.post_count > 0);
  const sectionResults = await Promise.all(
    categories.map((category) =>
      supabase
        .from('posts')
        .select(PUBLIC_BLOG_POST_COLUMNS)
        .eq('status', 'published')
        .eq('category_id', category.id)
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('slug', { ascending: true })
        .limit(3),
    ),
  );
  const sections = sectionResults
    .map((result, index) => {
      if (result.error)
        throw new Error(`카테고리 최신 글을 불러오지 못했습니다: ${result.error.message}`);
      return {
        category: categories[index],
        posts: ((result.data ?? []) as unknown as SupabaseBlogPostRow[]).map(toBlogPostSummary),
      };
    })
    .filter(({ posts }) => posts.length > 0);
  const pinned = ((pinnedResult.data ?? []) as unknown as SupabaseBlogPostRow[]).map(
    toBlogPostSummary,
  );
  const featured =
    pinned.length > 0
      ? selectFeaturedPosts(pinned)
      : selectFeaturedPosts(sections.flatMap(({ posts }) => posts.slice(0, 1)));

  return { featured, categories, sections };
}

const getSupabaseBlogShell = unstable_cache(
  (sourceIdentity: string) => {
    void sourceIdentity;
    return getSupabaseBlogShellUncached();
  },
  ['public-blog-shell-v2'],
  { revalidate: 60, tags: ['posts', 'post-categories'] },
);

async function getSupabaseBlogHomeData(filters: BlogPostFilters): Promise<BlogHomeData> {
  const normalized = normalizeBlogPostFilters(filters);
  const supabase = createPublicClient();
  let archiveQuery = supabase
    .from('posts')
    .select(PUBLIC_BLOG_POST_COLUMNS, { count: 'exact' })
    .eq('status', 'published');
  if (normalized.category) archiveQuery = archiveQuery.eq('category.slug', normalized.category);
  if (normalized.tag) archiveQuery = archiveQuery.contains('tags', [normalized.tag]);
  if (normalized.q) {
    const sqlLikeLiteral = normalized.q.replace(/[%_\\]/g, '\\$&');
    const literalPattern = sqlLikeLiteral.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    archiveQuery = archiveQuery.or(
      `title.ilike."%${literalPattern}%",description.ilike."%${literalPattern}%"`,
    );
  }
  archiveQuery = normalized.category
    ? archiveQuery.order('slug', { ascending: true })
    : archiveQuery
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('slug', { ascending: true });
  const from = (normalized.page - 1) * normalized.pageSize;
  const sourceIdentity = `supabase:${process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''}`;
  const [archiveResult, shell] = await Promise.all([
    archiveQuery.range(from, from + normalized.pageSize - 1),
    getSupabaseBlogShell(sourceIdentity),
  ]);
  if (archiveResult.error)
    throw new Error(`공개 글 목록을 불러오지 못했습니다: ${archiveResult.error.message}`);
  const totalItems = archiveResult.count ?? 0;
  return {
    ...shell,
    archive: {
      items: ((archiveResult.data ?? []) as unknown as SupabaseBlogPostRow[]).map(
        toBlogPostSummary,
      ),
      page: normalized.page,
      pageSize: normalized.pageSize,
      totalItems,
      totalPages: totalItems === 0 ? 0 : Math.ceil(totalItems / normalized.pageSize),
    },
  };
}

export async function getBlogHomeDataUncached(
  filters: BlogPostFilters = {},
): Promise<BlogHomeData> {
  const normalized = normalizeBlogPostFilters(filters);
  if (env.CONTENT_SOURCE === 'supabase') return getSupabaseBlogHomeData(normalized);

  const legacy =
    env.CONTENT_SOURCE === 'mock'
      ? mockPostList
      : await fetchPosts({ tag: undefined, sort: '-published_at' });
  const posts = legacy.map(legacyToBlogPostSummary);
  const latestPosts = filterAndPaginatePosts(posts, { page: 1, pageSize: 3 }).items;
  const categories = latestPosts.length ? [{ ...DEFAULT_CATEGORY, post_count: posts.length }] : [];
  return {
    featured: selectFeaturedPosts(posts),
    categories,
    sections: categories.map((category) => ({ category, posts: latestPosts })),
    archive: filterAndPaginatePosts(posts, normalized),
  };
}

const getBlogHomeDataFromServerCache = unstable_cache(
  (_source: string, filters: BlogPostFilters) => getBlogHomeDataUncached(filters),
  ['public-blog-home-v2'],
  { revalidate: 60, tags: ['posts', 'post-categories'] },
);

const getBlogHomeDataForRender = cache(
  (source: string, q: string, category: string, tag: string, page: number, pageSize: number) =>
    getBlogHomeDataFromServerCache(source, { q, category, tag, page, pageSize }),
);

/** Public-only data cached across visitors for 60s and deduplicated within one render. */
export function getBlogHomeData(filters: BlogPostFilters = {}): Promise<BlogHomeData> {
  const normalized = normalizeBlogPostFilters(filters);
  const sourceIdentity =
    env.CONTENT_SOURCE === 'api'
      ? `api:${env.CONTENT_API_BASE}`
      : env.CONTENT_SOURCE === 'supabase'
        ? `supabase:${process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''}`
        : 'mock';
  return getBlogHomeDataForRender(
    sourceIdentity,
    normalized.q,
    normalized.category,
    normalized.tag,
    normalized.page,
    normalized.pageSize,
  );
}

/** Public categories for the shared home/detail sidebar, backed by the shell cache. */
export async function getBlogCategories(): Promise<BlogCategoryWithCount[]> {
  if (env.CONTENT_SOURCE === 'supabase') {
    const sourceIdentity = `supabase:${process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''}`;
    return (await getSupabaseBlogShell(sourceIdentity)).categories;
  }
  return (await getBlogHomeData()).categories;
}

function legacyToBlogPost(post: Post): BlogPost {
  return {
    ...post,
    category: DEFAULT_CATEGORY,
    cover_image_key: null,
    cover_position: { x: 0.5, y: 0.5 },
    cover_alt: post.title,
    pin_order: null,
  };
}

async function getBlogPostUncached(slug: string): Promise<BlogPost> {
  const normalizedSlug = slug.normalize('NFC');
  if (normalizedSlug === '.' || normalizedSlug === '..') notFound();

  if (env.CONTENT_SOURCE !== 'supabase') {
    return legacyToBlogPost(await getPost(normalizedSlug));
  }

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('posts')
    .select(`${PUBLIC_BLOG_POST_COLUMNS},body`)
    .eq('status', 'published')
    .eq('slug', normalizedSlug)
    .maybeSingle();
  if (error) throw new Error(`공개 글을 불러오지 못했습니다: ${error.message}`);
  if (!data) notFound();
  const row = data as unknown as SupabaseBlogPostRow & { body: string };
  return {
    ...toBlogPostSummary(row),
    body_markdown: row.body,
    frontmatter: {},
  };
}

const getBlogPostForRender = cache((source: string, slug: string) =>
  unstable_cache(() => getBlogPostUncached(slug), ['public-blog-post-v1', source, slug], {
    revalidate: 60,
    tags: ['posts', `post:${slug}`],
  })(),
);

export function getBlogPost(slug: string): Promise<BlogPost> {
  const sourceIdentity =
    env.CONTENT_SOURCE === 'api'
      ? `api:${env.CONTENT_API_BASE}`
      : env.CONTENT_SOURCE === 'supabase'
        ? `supabase:${process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''}`
        : 'mock';
  return getBlogPostForRender(sourceIdentity, slug.normalize('NFC'));
}

export async function findBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    return await getBlogPost(slug);
  } catch (error) {
    const digest =
      error && typeof error === 'object' && 'digest' in error && typeof error.digest === 'string'
        ? error.digest
        : '';
    if (digest.startsWith('NEXT_HTTP_ERROR_FALLBACK;404')) return null;
    throw error;
  }
}
