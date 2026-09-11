import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ listComments: vi.fn(), createComment: vi.fn() }));
vi.mock('@features/comments/services/comments.service', async (load) => {
  const actual = await load<typeof import('@features/comments/services/comments.service')>();
  return { ...actual, listComments: mocks.listComments, createComment: mocks.createComment };
});
import {
  CommentNotFoundError,
  CommentRateLimitError,
} from '@features/comments/services/comments.service';
import { GET, POST } from '@/app/api/posts/[slug]/comments/route';

const context = (slug = 'design-system-00-prologue') => ({ params: Promise.resolve({ slug }) });

describe('/api/posts/[slug]/comments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('SITE_URL', 'https://raven.kr');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-secret');
  });

  const postRequest = (body: unknown, headers: HeadersInit = {}) =>
    new Request('https://raven.kr/api/posts/x/comments', {
      method: 'POST',
      headers: { origin: 'https://raven.kr', 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body),
    });

  it('returns the stable comment page contract', async () => {
    const page = { items: [], total: 0, nextCursor: null };
    mocks.listComments.mockResolvedValue(page);
    const response = await GET(new Request('https://raven.kr/api/posts/x/comments'), context());
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(page);
  });

  it('validates nickname, avatar and body before writing', async () => {
    const response = await POST(
      postRequest({ nickname: '', avatar_id: 'clay-65', body: ' ' }),
      context(),
    );
    expect(response.status).toBe(400);
    expect(mocks.createComment).not.toHaveBeenCalled();
  });

  it('trims text and returns the created comment', async () => {
    const comment = {
      id: crypto.randomUUID(),
      nickname: '익명',
      avatar_id: 'clay-01',
      body: '좋아요',
      created_at: new Date().toISOString(),
    };
    mocks.createComment.mockResolvedValue(comment);
    const response = await POST(
      postRequest(
        { nickname: ' 익명 ', avatar_id: 'clay-01', body: ' 좋아요 ' },
        { 'cf-connecting-ip': '192.0.2.1' },
      ),
      context(),
    );
    expect(response.status).toBe(201);
    expect(mocks.createComment).toHaveBeenCalledWith(
      expect.any(String),
      { nickname: '익명', avatar_id: 'clay-01', body: '좋아요' },
      expect.stringMatching(/^[0-9a-f]{64}$/),
    );
    await expect(response.json()).resolves.toEqual({ comment });
  });

  it.each([
    [new CommentNotFoundError(), 404],
    [new CommentRateLimitError(), 429],
  ])('maps domain errors without leaking details', async (error, status) => {
    mocks.createComment.mockRejectedValue(error);
    const response = await POST(
      postRequest({ nickname: '익명', avatar_id: 'clay-01', body: '댓글' }),
      context(),
    );
    expect(response.status).toBe(status);
    if (status === 429) expect(response.headers.get('retry-after')).toBe('600');
  });

  it('rejects cross-origin and non-JSON writes', async () => {
    const crossOrigin = await POST(
      postRequest(
        { nickname: '익명', avatar_id: 'clay-01', body: '댓글' },
        { origin: 'https://example.com' },
      ),
      context(),
    );
    expect(crossOrigin.status).toBe(403);
    const text = await POST(
      new Request('https://raven.kr/api/posts/x/comments', {
        method: 'POST',
        headers: { origin: 'https://raven.kr', 'content-type': 'text/plain' },
        body: 'x',
      }),
      context(),
    );
    expect(text.status).toBe(415);
  });
  it.each([{ parent_id: crypto.randomUUID() }, { parent_id: null }, { is_author: true }])(
    'rejects public reply/author spoofing %j',
    async (extra) => {
      const response = await POST(
        postRequest({ nickname: '익명', avatar_id: 'clay-01', body: '댓글', ...extra }),
        context(),
      );
      expect(response.status).toBe(400);
      expect(mocks.createComment).not.toHaveBeenCalled();
    },
  );
  it('returns thread metadata and chronological replies without altering pagination', async () => {
    const parent = {
      id: crypto.randomUUID(),
      parent_id: null,
      is_author: false,
      nickname: '독자',
      created_at: '2026-09-11T00:00:00Z',
    };
    const reply = {
      id: crypto.randomUUID(),
      parent_id: parent.id,
      is_author: true,
      nickname: 'raven',
      created_at: '2026-09-11T01:00:00Z',
    };
    const page = { items: [parent, reply], total: 1, nextCursor: null };
    mocks.listComments.mockResolvedValue(page);
    const response = await GET(new Request('https://raven.kr/api/posts/x/comments'), context());
    await expect(response.json()).resolves.toEqual(page);
  });
});
