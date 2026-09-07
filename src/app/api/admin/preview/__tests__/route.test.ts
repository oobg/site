import { beforeEach, describe, expect, it, vi } from 'vitest';

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
