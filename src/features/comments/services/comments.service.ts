import 'server-only';
import { createHmac } from 'node:crypto';
import { createServiceClient } from '@lib/supabase/service';
import type { AdminComment, Comment, CommentPage } from '@features/comments/types/comments.types';
import type { AuthorReplyInput, CommentInput } from '@features/comments/services/comments.schema';

const PAGE_SIZE = 20;
const REPLY_BATCH_SIZE = 200;

// Fetch every reply even when a thread exceeds the PostgREST row limit.
async function collectReplies<T>(
  fetchBatch: (offset: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  const rows: T[] = [];
  for (let offset = 0; ; offset += REPLY_BATCH_SIZE) {
    const { data, error } = await fetchBatch(offset);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < REPLY_BATCH_SIZE) return rows;
  }
}
const columns = 'id,parent_id,is_author,nickname,avatar_id,body,created_at';

export class CommentNotFoundError extends Error {}
export class CommentRateLimitError extends Error {}
export class CommentParentNotFoundError extends Error {}
export class CommentNestedReplyError extends Error {}

export const encodeCommentCursor = (comment: Pick<Comment, 'created_at' | 'id'>) =>
  Buffer.from(JSON.stringify({ created_at: comment.created_at, id: comment.id })).toString(
    'base64url',
  );

export const hashCommentFingerprint = (value: string) => {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!secret) throw new Error('Comment service is not configured');
  return createHmac('sha256', secret).update(`raven-comment-rate-limit:v1:${value}`).digest('hex');
};

export function buildCommentPage(rows: Comment[], total: number): CommentPage {
  const items = rows.slice(0, PAGE_SIZE);
  return {
    items,
    total,
    nextCursor: rows.length > PAGE_SIZE ? encodeCommentCursor(items.at(-1)!) : null,
  };
}

async function findPublishedPostId(slug: string) {
  const client = createServiceClient();
  const { data, error } = await client
    .from('posts')
    .select('id')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();
  if (error) throw error;
  return { client, postId: data?.id as string | undefined };
}

export async function listComments(
  slug: string,
  cursor?: { created_at: string; id: string },
): Promise<CommentPage> {
  const { client, postId } = await findPublishedPostId(slug);
  if (!postId) throw new CommentNotFoundError();
  const { count, error: countError } = await client
    .from('post_comments')
    .select('id', { count: 'exact', head: true })
    .eq('post_id', postId)
    .eq('moderation_status', 'visible')
    .is('parent_id', null);
  if (countError) throw countError;
  let query = client
    .from('post_comments')
    .select(columns)
    .eq('post_id', postId)
    .eq('moderation_status', 'visible')
    .is('parent_id', null)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(PAGE_SIZE + 1);
  if (cursor)
    query = query.or(
      `created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`,
    );
  const { data, error } = await query;
  if (error) throw error;
  const rows = (data ?? []) as Comment[];
  const page = buildCommentPage(rows, count ?? 0);
  if (!page.items.length) return page;
  const replies = await collectReplies((offset) =>
    client
      .from('post_comments')
      .select(columns)
      .eq('post_id', postId)
      .eq('moderation_status', 'visible')
      .in(
        'parent_id',
        page.items.map((parent) => parent.id),
      )
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })
      .range(offset, offset + REPLY_BATCH_SIZE - 1),
  );
  return { ...page, items: joinCommentThreads(page.items, (replies ?? []) as Comment[]) };
}

export async function createComment(
  slug: string,
  input: CommentInput,
  fingerprint: string,
): Promise<Comment> {
  const client = createServiceClient();
  const { data, error } = await client
    .rpc('create_post_comment', {
      p_slug: slug,
      p_nickname: input.nickname,
      p_avatar_id: input.avatar_id,
      p_body: input.body,
      p_fingerprint_hash: fingerprint,
    })
    .single();
  if (error?.message.includes('comment_post_not_found')) throw new CommentNotFoundError();
  if (error?.message.includes('comment_rate_limited')) throw new CommentRateLimitError();
  if (error) throw error;
  return {
    ...(data as Omit<Comment, 'parent_id' | 'is_author'>),
    parent_id: null,
    is_author: false,
  };
}

/** Parents keep their page order; replies are chronological with an ID tie-break. */
export function joinCommentThreads<T extends Comment>(parents: T[], replies: T[]): T[] {
  return parents.flatMap((parent) => [
    parent,
    ...replies
      .filter((reply) => reply.parent_id === parent.id)
      .sort(
        (a, b) => Date.parse(a.created_at) - Date.parse(b.created_at) || a.id.localeCompare(b.id),
      ),
  ]);
}

export async function createAuthorReply(input: AuthorReplyInput): Promise<Comment> {
  const client = createServiceClient();
  const { data: parent, error: parentError } = await client
    .from('post_comments')
    .select('id,post_id,parent_id')
    .eq('id', input.parent_id)
    .maybeSingle();
  if (parentError) throw parentError;
  if (!parent) throw new CommentParentNotFoundError();
  if (parent.parent_id !== null) throw new CommentNestedReplyError();
  const { data, error } = await client
    .from('post_comments')
    .insert({
      parent_id: parent.id,
      post_id: parent.post_id,
      nickname: 'raven',
      avatar_id: 'clay-64',
      body: input.body,
      is_author: true,
      fingerprint_hash: hashCommentFingerprint('owner-reply:v1'),
    })
    .select(columns)
    .single();
  if (error?.code === '23503') throw new CommentParentNotFoundError();
  if (error?.message.includes('comment_nested_reply')) throw new CommentNestedReplyError();
  if (error) throw error;
  return data as Comment;
}

export async function listCommentsForOwner(): Promise<AdminComment[]> {
  const client = createServiceClient();
  const selection = `${columns},moderation_status,posts!inner(slug)`;
  const { data, error } = await client
    .from('post_comments')
    .select(selection)
    .is('parent_id', null)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(200);
  if (error) throw error;
  if (!data?.length) return [];
  const replies = await collectReplies((offset) =>
    client
      .from('post_comments')
      .select(selection)
      .in(
        'parent_id',
        data.map((parent) => parent.id),
      )
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })
      .range(offset, offset + REPLY_BATCH_SIZE - 1),
  );
  const mapRow = (row: (typeof data)[number]) => {
    const { posts, ...comment } = row;
    return { ...comment, post_slug: (posts as unknown as { slug: string }).slug } as AdminComment;
  };
  return joinCommentThreads(data.map(mapRow), (replies ?? []).map(mapRow));
}

export async function setCommentModeration(id: string, status: 'visible' | 'hidden') {
  const { data, error } = await createServiceClient()
    .from('post_comments')
    .update({ moderation_status: status })
    .eq('id', id)
    .select(columns)
    .single();
  if (error) throw error;
  return data as Comment;
}

export async function deleteComment(id: string) {
  const { error } = await createServiceClient().from('post_comments').delete().eq('id', id);
  if (error) throw error;
}
