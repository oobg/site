/** Read-only public smoke. A 200 login HTML response is never healthy JSON. */
const origin = process.argv[2];
if (!['https://raven.kr', 'https://dev.raven.kr'].includes(origin)) {
  throw new Error('Expected https://raven.kr or https://dev.raven.kr');
}
const results = [];
for (const path of ['/health', '/', '/blog', '/about', '/admin', '/robots.txt']) {
  try {
    const response = await fetch(origin + path, {
      redirect: 'manual',
      signal: AbortSignal.timeout(15000),
    });
    const type = response.headers.get('content-type') ?? '';
    const text = await response.text();
    let ok = response.ok;
    if (path === '/health') {
      let body;
      try {
        body = JSON.parse(text);
      } catch {
        /* HTML/access response fails below. */
      }
      ok = ok && type.includes('application/json') && body?.status === 'ready';
    } else if (path === '/blog' && [307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      const destination = location ? new URL(location, origin) : null;
      ok = destination?.href === `${origin}/`;
    } else if (path === '/robots.txt') {
      ok =
        ok && (origin.includes('dev.') ? /Disallow:\s*\//i.test(text) : /User-agent:/i.test(text));
    } else {
      ok =
        ok &&
        type.includes('text/html') &&
        /<html/i.test(text) &&
        !text.includes('cloudflareaccess.com');
    }
    results.push({
      path,
      ok,
      status: response.status,
      contentType: type,
      bytes: Buffer.byteLength(text),
    });
  } catch {
    results.push({ path, ok: false, error: 'NETWORK_OR_TIMEOUT' });
  }
}
console.log(
  JSON.stringify(
    {
      origin,
      checkedAt: new Date().toISOString(),
      kind: 'public-liveness-and-render-only',
      results,
    },
    null,
    2,
  ),
);
if (results.some((item) => !item.ok)) process.exitCode = 1;
