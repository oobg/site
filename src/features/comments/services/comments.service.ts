import 'server-only';
import { createHmac } from 'node:crypto';
import { createServiceClient } from '@lib/supabase/service';
import type { AdminComment, Comment, CommentPage } from '@features/comments/types/comments.types';
import type { CommentInput } from '@features/comments/services/comments.schema';

const PAGE_SIZE = 20;
const columns = 'id,nickname,avatar_id,body,created_at';

export class CommentNotFoundError extends Error {}
export class CommentRateLimitError extends Error {}

export const encodeCommentCursor = (comment: Pick<Comment, 'created_at' | 'id'>) =>
  Buffer.from(JSON.stringify(comment)).toString('base64url');

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
    .eq('moderation_status', 'visible');
  if (countError) throw countError;
  let query = client
    .from('post_comments')
    .select(columns)
    .eq('post_id', postId)
    .eq('moderation_status', 'visible')
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
  return buildCommentPage(rows, count ?? 0);
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
  return data as Comment;
}

export async function listCommentsForOwner(): Promise<AdminComment[]> {
  const { data, error } = await createServiceClient()
    .from('post_comments')
    .select(`${columns},moderation_status,posts!inner(slug)`)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []).map((row) => {
    const post = row.posts as unknown as { slug: string };
    return {
      id: row.id,
      nickname: row.nickname,
      avatar_id: row.avatar_id,
      body: row.body,
      created_at: row.created_at,
      moderation_status: row.moderation_status,
      post_slug: post.slug,
    } as AdminComment;
  });
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
