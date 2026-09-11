import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Comment } from '@features/comments/types/comments.types';
const mocks = vi.hoisted(() => ({ client: vi.fn() }));
vi.mock('@lib/supabase/service', () => ({ createServiceClient: mocks.client }));
import {
  buildCommentPage,
  createAuthorReply,
  createComment,
  listComments,
  listCommentsForOwner,
  CommentParentNotFoundError,
  CommentNestedReplyError,
  joinCommentThreads,
} from './comments.service';

const comment = (index: number, parent_id: string | null = null): Comment => ({
  id: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
  parent_id,
  is_author: Boolean(parent_id),
  nickname: parent_id ? 'raven' : '익명',
  avatar_id: parent_id ? 'clay-64' : 'clay-01',
  body: `댓글 ${index}`,
  created_at: new Date(Date.UTC(2026, 8, 11, 0, 0, index)).toISOString(),
});
function database(results: object[]) {
  const queries = results.map((result) => {
    const query: Record<string, ReturnType<typeof vi.fn>> = {};
    for (const method of [
      'select',
      'eq',
      'is',
      'in',
      'order',
      'limit',
      'range',
      'or',
      'insert',
      'single',
      'maybeSingle',
    ])
      query[method] = vi.fn().mockReturnValue(query);
    query.then = vi.fn((resolve) => Promise.resolve(result).then(resolve));
    return query;
  });
  const client = { from: vi.fn(), rpc: vi.fn() };
  queries.forEach((query) => client.from.mockReturnValueOnce(query));
  mocks.client.mockReturnValue(client);
  return { queries, client };
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-secret');
});

describe('comment threads', () => {
  it('paginates parents and keeps total stable across pages', () => {
    const first = buildCommentPage(
      Array.from({ length: 21 }, (_, index) => comment(index)),
      34,
    );
    const second = buildCommentPage(
      Array.from({ length: 14 }, (_, index) => comment(index + 20)),
      34,
    );
    expect(first.items).toHaveLength(20);
    expect(first.total).toBe(34);
    expect(JSON.parse(Buffer.from(first.nextCursor!, 'base64url').toString())).toEqual({
      id: comment(19).id,
      created_at: comment(19).created_at,
    });
    expect(second).toMatchObject({ total: 34, nextCursor: null });
  });
  it('keeps every reply attached to its parent, chronological and deterministic', () => {
    const parents = [comment(2), comment(1)];
    const replies = [
      comment(5, parents[0].id),
      { ...comment(4, parents[0].id), created_at: comment(5).created_at },
      comment(6, parents[1].id),
      comment(7, 'hidden-parent'),
    ];
    expect(joinCommentThreads(parents, replies).map((row) => row.id)).toEqual([
      comment(2).id,
      comment(4).id,
      comment(5).id,
      comment(1).id,
      comment(6).id,
    ]);
  });
  it('fetches 20 top-level threads and all their visible replies, excluding hidden-parent orphans', async () => {
    const parents = Array.from({ length: 21 }, (_, index) => comment(index));
    const replies = Array.from({ length: 40 }, (_, index) => comment(index + 30, parents[0].id));
    const { queries } = database([
      { data: { id: 'post' } },
      { count: 34 },
      { data: parents },
      { data: [...replies, comment(90, parents[20].id)] },
    ]);
    const page = await listComments('post');
    expect(page.items).toHaveLength(60);
    expect(page.total).toBe(34);
    expect(page.items[0]).toEqual(parents[0]);
    expect(page.items.slice(1, 41)).toEqual(replies);
    expect(page.items).not.toContainEqual(comment(90, parents[20].id));
    for (const query of [queries[1], queries[2]]) {
      expect(query.is).toHaveBeenCalledWith('parent_id', null);
      expect(query.eq).toHaveBeenCalledWith('moderation_status', 'visible');
      expect(query.eq).toHaveBeenCalledWith('post_id', 'post');
    }
    expect(queries[2].limit).toHaveBeenCalledWith(21);
    expect(queries[3].in).toHaveBeenCalledWith(
      'parent_id',
      parents.slice(0, 20).map((row) => row.id),
    );
    expect(queries[3].eq).toHaveBeenCalledWith('moderation_status', 'visible');
    expect(queries[3].order).toHaveBeenCalledWith('created_at', { ascending: true });
    expect(queries[3].order).toHaveBeenCalledWith('id', { ascending: true });
  });
  it('fetches additional reply batches instead of silently truncating large threads', async () => {
    const parent = comment(1);
    const replies = Array.from({ length: 201 }, (_, index) => comment(index + 2, parent.id));
    const { queries } = database([
      { data: { id: 'post' } },
      { count: 1 },
      { data: [parent] },
      { data: replies.slice(0, 200) },
      { data: replies.slice(200) },
    ]);
    const page = await listComments('post');
    expect(page.items).toHaveLength(202);
    expect(page.nextCursor).toBeNull();
    expect(queries[3].range).toHaveBeenCalledWith(0, 199);
    expect(queries[4].range).toHaveBeenCalledWith(200, 399);
  });
  it('uses only the parent cursor and avoids a reply query for an empty page', async () => {
    const { queries, client } = database([{ data: { id: 'post' } }, { count: 34 }, { data: [] }]);
    const cursor = { id: comment(19).id, created_at: comment(19).created_at };
    expect(await listComments('post', cursor)).toEqual({ items: [], total: 34, nextCursor: null });
    expect(queries[2].or).toHaveBeenCalledWith(
      `created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`,
    );
    expect(client.from).toHaveBeenCalledTimes(3);
  });
  it('returns owner hierarchy with hidden comments and every selected parent reply', async () => {
    const parent = { ...comment(1), moderation_status: 'hidden', posts: { slug: 'post' } };
    const reply = {
      ...comment(2, parent.id),
      moderation_status: 'visible',
      posts: { slug: 'post' },
    };
    const { queries } = database([{ data: [parent] }, { data: [reply] }]);
    expect(await listCommentsForOwner()).toMatchObject([
      { id: parent.id, post_slug: 'post', moderation_status: 'hidden' },
      { id: reply.id, parent_id: parent.id, is_author: true },
    ]);
    expect(queries[0].is).toHaveBeenCalledWith('parent_id', null);
    expect(queries[1].in).toHaveBeenCalledWith('parent_id', [parent.id]);
  });
});

describe('comment writes', () => {
  it('derives reply identity, post, and fingerprint exclusively on the server', async () => {
    const parent = { id: comment(1).id, post_id: 'trusted-post', parent_id: null };
    const reply = comment(2, parent.id);
    const { queries } = database([{ data: parent }, { data: reply }]);
    expect(await createAuthorReply({ parent_id: parent.id, body: '답글' })).toEqual(reply);
    expect(queries[1].insert).toHaveBeenCalledWith({
      parent_id: parent.id,
      post_id: 'trusted-post',
      body: '답글',
      nickname: 'raven',
      avatar_id: 'clay-64',
      is_author: true,
      fingerprint_hash: expect.stringMatching(/^[0-9a-f]{64}$/),
    });
  });
  it.each([
    [null, CommentParentNotFoundError],
    [{ id: comment(1).id, parent_id: comment(0).id }, CommentNestedReplyError],
  ])('rejects a missing or nested parent before insertion', async (parent, ErrorType) => {
    const { client } = database([{ data: parent }]);
    await expect(
      createAuthorReply({ parent_id: comment(1).id, body: '답글' }),
    ).rejects.toBeInstanceOf(ErrorType);
    expect(client.from).toHaveBeenCalledTimes(1);
  });
  it('handles a parent deleted between validation and insert', async () => {
    database([
      { data: { id: comment(1).id, parent_id: null, post_id: 'post' } },
      { error: { code: '23503' } },
    ]);
    await expect(
      createAuthorReply({ parent_id: comment(1).id, body: '답글' }),
    ).rejects.toBeInstanceOf(CommentParentNotFoundError);
  });
  it('preserves the public RPC signature and adds default thread metadata to its legacy return', async () => {
    const legacy = {
      id: comment(1).id,
      body: '댓글',
      nickname: '독자',
      avatar_id: 'clay-01',
      created_at: comment(1).created_at,
    };
    const { client } = database([]);
    client.rpc.mockReturnValue({ single: vi.fn().mockResolvedValue({ data: legacy }) });
    const input = { nickname: '독자', avatar_id: 'clay-01', body: '댓글' };
    expect(await createComment('post', input, 'hash')).toEqual({
      ...legacy,
      parent_id: null,
      is_author: false,
    });
    expect(client.rpc).toHaveBeenCalledWith('create_post_comment', {
      p_slug: 'post',
      p_nickname: '독자',
      p_avatar_id: 'clay-01',
      p_body: '댓글',
      p_fingerprint_hash: 'hash',
    });
  });
});
