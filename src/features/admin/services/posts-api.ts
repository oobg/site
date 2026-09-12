import 'server-only';

import { getAssetStorageConfig } from '@configs/cms-env';
import type { AdminPost } from '@features/admin/types/posts-admin.types';
import {
  adminPostInputSchema,
  adminPostSlugSchema,
  MAX_POST_MARKDOWN_LENGTH,
  MAX_POST_REQUEST_BYTES,
  type AdminPostInput,
} from '@features/admin/services/posts-api.schema';
import { AdminApiError, readLimitedBody } from '@lib/api/admin-http';
import { createAdminApiClient } from '@lib/auth/admin-api';
import {
  refreshApiPostPaths,
  refreshPublicPostCache,
} from '@features/admin/services/posts.refresh';

type Client = Awaited<ReturnType<typeof createAdminApiClient>>;
type DatabaseError = { code?: string };
const columns =
  'id,title,slug,description,body,status,published_at,created_at,updated_at,category_id,tags,cover_image_key,cover_image_url,cover_position_x,cover_position_y,cover_alt,pin_order';

export function parseAdminPostSlug(slug: string): string {
  const parsed = adminPostSlugSchema.safeParse(slug);
  if (!parsed.success || parsed.data !== slug.normalize('NFC'))
    throw new AdminApiError(400, 'INVALID_SLUG', '글 주소가 올바르지 않습니다.');
  return parsed.data;
}

export async function readAdminPostInput(request: Request, pathSlug?: string) {
  if (
    request.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase() !==
    'application/json'
  )
    throw new AdminApiError(415, 'UNSUPPORTED_MEDIA_TYPE', 'JSON 요청만 지원합니다.');
  const bytes = await readLimitedBody(request, MAX_POST_REQUEST_BYTES);
  let json: unknown;
  try {
    json = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch {
    throw new AdminApiError(400, 'INVALID_JSON', '요청 형식이 올바르지 않습니다.');
  }
  if (json && typeof json === 'object' && !Array.isArray(json)) {
    if (
      'body' in json &&
      typeof json.body === 'string' &&
      json.body.length > MAX_POST_MARKDOWN_LENGTH
    )
      throw new AdminApiError(
        413,
        'MARKDOWN_TOO_LONG',
        'Markdown 본문은 200,000자 이하여야 합니다.',
      );
    if (pathSlug && !('slug' in json)) json = { ...json, slug: pathSlug };
  }
  const parsed = adminPostInputSchema.safeParse(json);
  if (!parsed.success) throw new AdminApiError(422, 'INVALID_POST', '글 입력값을 확인해 주세요.');
  if (pathSlug && parsed.data.slug !== pathSlug)
    throw new AdminApiError(400, 'SLUG_MISMATCH', '본문 slug와 요청 주소가 일치해야 합니다.');
  return parsed.data;
}

function databaseFailure(error: DatabaseError): never {
  if (error.code === '23505')
    throw new AdminApiError(409, 'POST_CONFLICT', '이미 사용 중인 slug 또는 pin_order입니다.');
  if (error.code === '23503')
    throw new AdminApiError(422, 'INVALID_CATEGORY', '존재하는 카테고리를 선택해 주세요.');
  if (error.code === '23514')
    throw new AdminApiError(422, 'INVALID_POST', '글 입력값이 저장 조건에 맞지 않습니다.');
  if (['23502', '22P02', '22001', '22003', '22007', '22008'].includes(error.code ?? ''))
    throw new AdminApiError(400, 'INVALID_POST', '글 입력값이 저장 조건에 맞지 않습니다.');
  if (error.code === '42501')
    throw new AdminApiError(403, 'FORBIDDEN', '글을 저장할 권한이 없습니다.');
  throw error;
}

export async function findAdminApiPost(client: Client, slug: string): Promise<AdminPost | null> {
  const { data, error } = await client.from('posts').select(columns).eq('slug', slug).maybeSingle();
  if (error) databaseFailure(error);
  return data as AdminPost | null;
}

function valuesFor(input: AdminPostInput, current?: AdminPost | null) {
  const publishedAt =
    input.published_at === undefined
      ? current?.status === 'published'
        ? current.published_at
        : new Date().toISOString()
      : input.published_at === null || input.published_at.endsWith('Z')
        ? input.published_at
        : new Date(input.published_at).toISOString();
  return {
    ...input,
    cover_image_url: input.cover_image_key
      ? `${getAssetStorageConfig().publicUrl}/${input.cover_image_key}`
      : null,
    published_at: input.status === 'draft' ? null : publishedAt,
    pin_order:
      input.status === 'draft'
        ? null
        : input.pin_order === undefined
          ? (current?.pin_order ?? null)
          : input.pin_order,
  };
}

function refreshPost(post: AdminPost) {
  refreshPublicPostCache(undefined, post.slug);
  refreshApiPostPaths(post.slug);
}

export async function createAdminApiPost(client: Client, input: AdminPostInput) {
  const { data, error } = await client
    .from('posts')
    .insert(valuesFor(input))
    .select(columns)
    .single();
  if (error) databaseFailure(error);
  if (!data) throw new Error('Post insert returned no row');
  const post = data as AdminPost;
  refreshPost(post);
  return { post, created: true };
}

function samePostValue(key: string, previous: unknown, next: unknown) {
  if (key === 'published_at' && typeof previous === 'string' && typeof next === 'string') {
    // PostgreSQL may return another UTC format. Retain sub-millisecond precision.
    const fraction = (timestamp: string) =>
      (timestamp.match(/\.(\d+)/)?.[1] ?? '').replace(/0+$/, '');
    return Date.parse(previous) === Date.parse(next) && fraction(previous) === fraction(next);
  }
  return JSON.stringify(previous) === JSON.stringify(next);
}

export async function putAdminApiPost(client: Client, input: AdminPostInput) {
  // Keep publication time and updated_at stable on an identical retry. Optimistic
  // updates also avoid choosing a new publication time after a concurrent write.
  for (let attempt = 0; attempt < 3; attempt++) {
    const current = await findAdminApiPost(client, input.slug);
    const values = valuesFor(input, current);
    if (
      current &&
      Object.entries(values).every(([key, value]) =>
        samePostValue(key, current[key as keyof AdminPost], value),
      )
    ) {
      refreshPost(current);
      return { post: current, created: false };
    }
    const result = current
      ? await client
          .from('posts')
          .update(values)
          .eq('id', current.id)
          .eq('updated_at', current.updated_at)
          .select(columns)
          .maybeSingle()
      : await client.from('posts').insert(values).select(columns).single();
    // A competing first PUT may have created this slug. Read it before trying again.
    if (!current && result.error?.code === '23505' && attempt < 2) continue;
    if (result.error) databaseFailure(result.error);
    if (!result.data) continue;
    const post = result.data as AdminPost;
    refreshPost(post);
    return { post, created: !current };
  }
  throw new AdminApiError(409, 'POST_CHANGED', '글이 동시에 변경되었습니다. 다시 요청해 주세요.');
}
