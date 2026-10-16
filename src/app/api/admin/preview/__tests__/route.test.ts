import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from '@/app/api/admin/preview/route';

const { requireOwner, renderMarkdown } = vi.hoisted(() => ({
  requireOwner: vi.fn(),
  renderMarkdown: vi.fn(),
}));

vi.mock('@lib/auth/owner', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@lib/auth/owner')>();
  return { ...actual, requireOwner };
});
vi.mock('@lib/markdown/render', () => ({ renderMarkdown }));

function request(markdown: unknown, origin = 'https://raven.kr') {
  return new Request('https://raven.kr/api/admin/preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', origin },
    body: JSON.stringify({ markdown }),
  });
}

describe('POST /api/admin/preview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('SITE_URL', 'https://raven.kr');
    requireOwner.mockResolvedValue(undefined);
    renderMarkdown.mockResolvedValue({ html: '<p>미리보기</p>', toc: [] });
  });
  afterEach(() => vi.unstubAllEnvs());

  it('requires the configured site origin before owner access', async () => {
    const response = await POST(request('본문', 'https://example.com'));

    expect(response.status).toBe(403);
    expect(requireOwner).not.toHaveBeenCalled();
  });

  it('renders an owner Markdown preview without caching it', async () => {
    const response = await POST(request('# 본문'));

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(requireOwner).toHaveBeenCalledOnce();
    expect(renderMarkdown).toHaveBeenCalledWith('# 본문');
    await expect(response.json()).resolves.toEqual({ html: '<p>미리보기</p>' });
  });

  it('rejects oversized Markdown before rendering it', async () => {
    const response = await POST(request('가'.repeat(200_001)));

    expect(response.status).toBe(413);
    expect(renderMarkdown).not.toHaveBeenCalled();
  });

  it.each([undefined, '1'])('limits UTF-8 bytes with Content-Length %s', async (length) => {
    const headers = new Headers({ origin: 'https://raven.kr', 'content-type': 'application/json' });
    if (length !== undefined) headers.set('content-length', length);
    const response = await POST(
      new Request('https://raven.kr/api/admin/preview', {
        method: 'POST',
        headers,
        body: JSON.stringify({ markdown: '# 본문', padding: '가'.repeat(333_334) }),
      }),
    );

    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toEqual({ error: '본문이 너무 깁니다.' });
    expect(renderMarkdown).not.toHaveBeenCalled();
  });

  it('accepts a body exactly at the byte limit', async () => {
    const response = await POST(
      new Request('https://raven.kr/api/admin/preview', {
        method: 'POST',
        headers: { origin: 'https://raven.kr', 'content-type': 'application/json' },
        body: JSON.stringify({ markdown: '# preview' }).padEnd(1_000_000, ' '),
      }),
    );

    expect(response.status).toBe(200);
    expect(renderMarkdown).toHaveBeenCalledWith('# preview');
  });

  it('cancels an oversized stream before reading its remaining chunks', async () => {
    const cancel = vi.fn();
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(1_000_000));
        controller.enqueue(new Uint8Array(1));
        controller.enqueue(new Uint8Array(32));
        controller.close();
      },
      cancel,
    });
    const init = {
      method: 'POST',
      headers: { origin: 'https://raven.kr', 'content-type': 'application/json' },
      body,
      duplex: 'half',
    };
    const response = await POST(new Request('https://raven.kr/api/admin/preview', init));

    expect(response.status).toBe(413);
    expect(cancel).toHaveBeenCalledOnce();
    expect(renderMarkdown).not.toHaveBeenCalled();
  });

  it('rejects a null JSON payload as a bad request', async () => {
    const response = await POST(
      new Request('https://raven.kr/api/admin/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', origin: 'https://raven.kr' },
        body: 'null',
      }),
    );

    expect(response.status).toBe(400);
    expect(renderMarkdown).not.toHaveBeenCalled();
  });
});
