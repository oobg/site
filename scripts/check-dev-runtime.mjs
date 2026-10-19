/** Read-only smoke executed inside raven-web-dev. No credentials or content are printed. */
import { pathToFileURL } from 'node:url';

const origin = 'http://127.0.0.1:3000';
export async function checkDevRuntime(fetcher = fetch, runtime = process.env) {
  const checks = [];
  const record = (name, ok, extra = {}) => checks.push({ name, ok, ...extra });
  record(
    'environment-boundary',
    runtime.SITE_URL === 'https://dev.raven.kr' &&
      runtime.SITE_INDEXABLE === 'false' &&
      runtime.CONTENT_SOURCE === 'supabase' &&
      runtime.ASSET_STORAGE_BACKEND === 'local',
  );
  async function request(path, kind) {
    try {
      const response = await fetcher(origin + path, {
        redirect: 'manual',
        signal: AbortSignal.timeout(15000),
      });
      const text = await response.text();
      const type = response.headers.get('content-type') ?? '';
      let data;
      if (kind === 'json') {
        try {
          data = JSON.parse(text);
        } catch {
          /* HTML with HTTP 200 fails the JSON check. */
        }
      }
      const ok =
        response.ok &&
        (kind === 'json'
          ? type.includes('application/json') && data !== undefined
          : kind === 'html'
            ? type.includes('text/html') &&
              /<html/i.test(text) &&
              !text.includes('cloudflareaccess.com')
            : true);
      return { response, text, data, ok };
    } catch {
      return { ok: false };
    }
  }
  const health = await request('/health', 'json');
  record('process-health', health.ok && health.data?.status === 'ready', {
    status: health.response?.status,
  });
  for (const path of ['/', '/about', '/admin']) {
    const page = await request(path, 'html');
    record(path, page.ok, { status: page.response?.status });
  }
  const blog = await request('/blog', 'html');
  const location = blog.response?.headers.get('location');
  record('/blog', blog.ok || ([307, 308].includes(blog.response?.status) && location === '/'), {
    status: blog.response?.status,
  });
  const robots = await request('/robots.txt', 'text');
  record(
    'dev-noindex',
    robots.ok &&
      /^Disallow:\s*\/\s*$/im.test(robots.text ?? '') &&
      !/^Allow:\s*\/\s*$/im.test(robots.text ?? ''),
    { status: robots.response?.status },
  );
  const listing = await request('/api/posts?page=1&pageSize=1', 'json');
  const posts = listing.data?.archive?.items;
  const validList =
    listing.ok && Array.isArray(posts) && posts.every((post) => post.status === 'published');
  record('published-list-api', validList, { status: listing.response?.status });
  const post = validList ? posts[0] : null;
  if (post && typeof post.slug === 'string' && typeof post.category?.slug === 'string') {
    const path = `/blog/${encodeURIComponent(post.category.slug)}/${encodeURIComponent(post.slug)}`;
    const detail = await request(path, 'html');
    record('published-detail', detail.ok, { status: detail.response?.status });
    const api = await request(`/api/posts/${encodeURIComponent(post.slug)}`, 'json');
    record('published-detail-api', api.ok && api.data?.status === 'published', {
      status: api.response?.status,
    });
  } else {
    record('published-detail', false, { reason: 'NO_PUBLISHED_SAMPLE' });
  }
  return {
    checkedAt: new Date().toISOString(),
    mode: 'container-read-only',
    ok: checks.every((check) => check.ok),
    checks,
  };
}

if (
  process.argv[1] === '-' ||
  (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
) {
  const result = await checkDevRuntime();
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
}
