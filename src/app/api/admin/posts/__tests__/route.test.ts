import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  client: vi.fn(),
  storage: vi.fn(),
  invalidate: vi.fn(),
  revalidate: vi.fn(),
}));
vi.mock('@lib/auth/admin-api', () => ({
  requireAdminApiAccess: mocks.auth,
  createAdminApiClient: mocks.client,
}));
vi.mock('@configs/cms-env', async (original) => ({
  ...(await original<typeof import('@configs/cms-env')>()),
  getAssetStorageConfig: mocks.storage,
}));
vi.mock('@lib/cache/posts', () => ({ invalidatePublicPostCache: mocks.invalidate }));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidate }));
import { POST } from '@/app/api/admin/posts/route';
import { GET, PUT } from '@/app/api/admin/posts/[slug]/route';
import { OwnerAuthorizationError } from '@lib/auth/owner';
import { CmsConfigurationError } from '@configs/cms-env';

const input = {
  title: '글 제목',
  slug: 'test-post',
  description: '설명',
  body: '# Markdown\n본문',
  status: 'published',
};
const context = (slug = 'test-post') => ({ params: Promise.resolve({ slug }) });
const request = (body: unknown = input, method = 'POST') =>
  new Request('https://dev.raven.kr/api/admin/posts/test-post', {
    method,
    headers: { 'content-type': 'application/json', origin: 'https://dev.raven.kr' },
    ...(method === 'GET' ? {} : { body: JSON.stringify(body) }),
  });
type Row = Record<string, unknown>;
const rows = new Map<string, Row>();
let databaseError: { code: string; message: string } | null;
let insertRace: boolean;
let mutations: number;

function database() {
  return {
    from: vi.fn(() => {
      let operation = 'read';
      let values: Row = {};
      let column = 'slug';
      let expected: unknown;
      const execute = async () => {
        if (databaseError) return { data: null, error: databaseError };
        if (operation === 'read')
          return {
            data: [...rows.values()].find((row) => row[column] === expected) ?? null,
            error: null,
          };
        mutations++;
        if (operation === 'insert') {
          if (insertRace) {
            rows.set(String(values.slug), {
              ...values,
              id: 'race-winner',
              published_at: '2020-01-01T00:00:00Z',
            });
            insertRace = false;
          }
          if (rows.has(String(values.slug))) return { data: null, error: { code: '23505' } };
          const row = { ...values, id: 'new-post-id' };
          rows.set(String(values.slug), row);
          return { data: row, error: null };
        }
        const previous = [...rows.values()].find((row) => row[column] === expected);
        const row = { ...previous, ...values };
        rows.set(String(row.slug), row);
        return { data: row, error: null };
      };
      const query = {
        select: vi.fn(() => query),
        eq: vi.fn((key: string, value: unknown) => {
          column = key;
          expected = value;
          return query;
        }),
        insert: vi.fn((value: Row) => {
          operation = 'insert';
          values = value;
          return query;
        }),
        update: vi.fn((value: Row) => {
          operation = 'update';
          values = value;
          return query;
        }),
        single: execute,
        maybeSingle: execute,
      };
      return query;
    }),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  rows.clear();
  databaseError = null;
  insertRace = false;
  mutations = 0;
  mocks.auth.mockReset().mockResolvedValue({ mode: 'owner', actor: 'owner@example.com' });
  mocks.client.mockReset().mockResolvedValue(database());
  mocks.storage.mockReset().mockReturnValue({ publicUrl: 'https://cdn-dev.raven.kr' });
});
afterEach(() => vi.unstubAllEnvs());

describe('admin post HTTP contract', () => {
  it('creates Markdown posts with defaults and invalidates UI/public caches', async () => {
    const response = await POST(request());
    expect(response.status).toBe(201);
    expect(response.headers.get('cache-control')).toBe('no-store');
    const result = await response.json();
    expect(result).toMatchObject({
      created: true,
      post: {
        ...input,
        category_id: '00000000-0000-4000-8000-000000000001',
        tags: [],
        cover_image_url: null,
        pin_order: null,
      },
    });
    expect(Date.parse(result.post.published_at)).toBeGreaterThan(Date.now() - 10000);
    expect(mocks.invalidate).toHaveBeenCalledWith({ oldSlug: undefined, newSlug: 'test-post' });
    expect(mocks.revalidate.mock.calls.flat()).toEqual(['/', '/blog', '/admin', '/blog/test-post']);
  });
  it('returns a safe 409 for duplicate POST', async () => {
    await POST(request());
    expect((await POST(request())).status).toBe(409);
    expect(rows.size).toBe(1);
  });
  it('repeated PUT preserves identity, date and ordering while updating content', async () => {
    const original = { ...input, published_at: '2022-03-01T00:00:00Z', pin_order: 3 };
    const first = await PUT(request(original, 'PUT'), context());
    expect(first.status).toBe(201);
    const second = await PUT(request({ ...input, body: 'updated' }, 'PUT'), context());
    expect(second.status).toBe(200);
    expect(await second.json()).toMatchObject({
      created: false,
      post: {
        id: 'new-post-id',
        body: 'updated',
        published_at: original.published_at,
        pin_order: 3,
      },
    });
    expect(rows.size).toBe(1);
  });
  it('uses server time only on first publication when omitted', async () => {
    const first = await (await PUT(request(input, 'PUT'), context())).json();
    const second = await (await PUT(request(input, 'PUT'), context())).json();
    expect(second.post.published_at).toBe(first.post.published_at);
  });
  it('recovers a concurrent slug insert without duplication or resetting its date', async () => {
    insertRace = true;
    const response = await PUT(request(input, 'PUT'), context());
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      created: false,
      post: { id: 'race-winner', published_at: '2020-01-01T00:00:00Z' },
    });
    expect(rows.size).toBe(1);
  });
  it('clears publish metadata on draft and returns drafts only through authenticated lookup', async () => {
    await PUT(request({ ...input, pin_order: 2 }, 'PUT'), context());
    const response = await PUT(request({ ...input, status: 'draft' }, 'PUT'), context());
    expect(await response.json()).toMatchObject({
      post: { status: 'draft', published_at: null, pin_order: null },
    });
    const found = await GET(request(undefined, 'GET'), context());
    expect(await found.json()).toMatchObject({ post: { status: 'draft', body: input.body } });
    expect(found.headers.get('cache-control')).toBe('no-store');
    expect((await GET(request(undefined, 'GET'), context('missing'))).status).toBe(404);
  });
  it.each(['https://cdn-dev.raven.kr', 'https://cdn.raven.kr'])(
    'derives cover URL from runtime storage %s',
    async (publicUrl) => {
      mocks.storage.mockReturnValue({ publicUrl });
      const key = 'assets/posts/2026-09-10/design-system-00-v2.png';
      const response = await POST(
        request({
          ...input,
          cover_image_key: key,
          cover_alt: '설명',
          cover_position_x: 0.25,
          cover_position_y: 0.7,
        }),
      );
      expect(await response.json()).toMatchObject({
        post: {
          cover_image_url: `${publicUrl}/${key}`,
          cover_alt: '설명',
          cover_position_x: 0.25,
          cover_position_y: 0.7,
        },
      });
    },
  );
  it.each([
    { cover_image_key: '../escape.png' },
    { cover_image_url: 'https://cdn.raven.kr/a.png' },
    { body_markdown: 'wrong field' },
    { title: '' },
    { category_id: 'no-uuid' },
    { pin_order: 6 },
    { pin_order: 1.5 },
    { published_at: 'yesterday' },
    { status: 'draft', published_at: '2022-01-01T00:00:00Z' },
    { status: 'draft', pin_order: 1 },
  ])('rejects invalid input before DB access: %j', async (extra) => {
    expect((await POST(request({ ...input, ...extra }))).status).toBe(422);
    expect(mocks.client).not.toHaveBeenCalled();
  });
  it('rejects slug mismatch and malformed paths', async () => {
    expect((await PUT(request(input, 'PUT'), context('different'))).status).toBe(400);
    expect((await PUT(request(input, 'PUT'), context('../escape'))).status).toBe(400);
    expect(mutations).toBe(0);
  });
  it.each([
    ['23505', 409],
    ['23503', 422],
    ['23514', 422],
    ['42501', 403],
    ['XX000', 500],
  ])('maps database %s to safe %s', async (code, status) => {
    databaseError = { code: String(code), message: 'SECRET table endpoint' };
    const response = await POST(request());
    expect(response.status).toBe(status);
    expect(await response.text()).not.toContain('SECRET');
    expect(mocks.invalidate).not.toHaveBeenCalled();
  });
  it('rejects malformed JSON and request/Markdown limits', async () => {
    const malformed = request();
    const bad = new Request(malformed, { body: '{' });
    expect((await POST(bad)).status).toBe(400);
    expect((await POST(request({ ...input, body: 'x'.repeat(200001) }))).status).toBe(413);
    expect((await POST(request({ ...input, body: 'x'.repeat(1000001) }))).status).toBe(413);
    const declared = request();
    declared.headers.set('content-length', '1000001');
    expect((await POST(declared)).status).toBe(413);
    expect(mutations).toBe(0);
  });
  it('stops all routes before reading input or DB when unauthorized', async () => {
    mocks.auth.mockRejectedValue(new OwnerAuthorizationError('로그인이 필요합니다.', 401));
    expect((await POST(request())).status).toBe(401);
    expect((await PUT(request(input, 'PUT'), context())).status).toBe(401);
    expect((await GET(request(undefined, 'GET'), context())).status).toBe(401);
    expect(mocks.client).not.toHaveBeenCalled();
  });
  it('passes Access context to the authorized client factory and reports missing service configuration', async () => {
    const access = { mode: 'access', actor: 'agent' };
    mocks.auth.mockResolvedValue(access);
    expect((await POST(request())).status).toBe(201);
    expect(mocks.client).toHaveBeenCalledWith(access);
    mocks.client.mockRejectedValue(new CmsConfigurationError('secret config'));
    const response = await GET(request(undefined, 'GET'), context());
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain('secret');
  });
});
