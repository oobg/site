import { describe, expect, it } from 'vitest';
import { checkDevRuntime } from './check-dev-runtime.mjs';

const runtime = {
  SITE_URL: 'https://dev.raven.kr',
  SITE_INDEXABLE: 'false',
  CONTENT_SOURCE: 'supabase',
  ASSET_STORAGE_BACKEND: 'local',
};
const post = { slug: 'example', category: { slug: 'notes' }, status: 'published' };
const json = (value) =>
  new Response(JSON.stringify(value), { headers: { 'content-type': 'application/json' } });
const html = () =>
  new Response('<html><body>public</body></html>', { headers: { 'content-type': 'text/html' } });
const successful = async (url) => {
  const path = new URL(url).pathname;
  if (path === '/health') return json({ status: 'ready' });
  if (path === '/api/posts') return json({ archive: { items: [post] } });
  if (path === '/api/posts/example') return json(post);
  if (path === '/blog') return new Response(null, { status: 308, headers: { location: '/' } });
  if (path === '/robots.txt') return new Response('User-Agent: *\nDisallow: /\n');
  return html();
};

describe('dev container smoke', () => {
  it('connects liveness, published content, admin render, and dev noindex without mutations', async () => {
    const result = await checkDevRuntime(successful, runtime);
    expect(result.ok).toBe(true);
    expect(result.checks).toHaveLength(10);
  });
  it('rejects Access login HTML even when it returns HTTP 200', async () => {
    const result = await checkDevRuntime(
      async (url) => (new URL(url).pathname === '/health' ? html() : successful(url)),
      runtime,
    );
    expect(result.ok).toBe(false);
    expect(result.checks.find((item) => item.name === 'process-health')?.ok).toBe(false);
  });
  it('fails when data is unavailable or a draft appears in the public list', async () => {
    const result = await checkDevRuntime(
      async (url) =>
        new URL(url).pathname === '/api/posts'
          ? json({ archive: { items: [{ ...post, status: 'draft' }] } })
          : successful(url),
      runtime,
    );
    expect(result.ok).toBe(false);
    expect(result.checks.find((item) => item.name === 'published-list-api')?.ok).toBe(false);
  });
  it('rejects production runtime boundaries and public indexing', async () => {
    const result = await checkDevRuntime(
      async (url) =>
        new URL(url).pathname === '/robots.txt'
          ? new Response('User-Agent: *\nAllow: /\n')
          : successful(url),
      { ...runtime, SITE_URL: 'https://raven.kr' },
    );
    expect(result.ok).toBe(false);
    expect(result.checks.filter((item) => !item.ok).map((item) => item.name)).toEqual([
      'environment-boundary',
      'dev-noindex',
    ]);
  });
});
