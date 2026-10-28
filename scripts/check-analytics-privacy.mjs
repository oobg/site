/**
 * Real SDK probe with synthetic documents. Every non-script external request is
 * aborted before transmission; this never writes analytics data or opens admin.
 * Usage: PLAYWRIGHT_MODULE=/absolute/playwright-core/index.mjs CHROME_BIN=... node scripts/check-analytics-privacy.mjs
 */
import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright'
);
const html = await (await fetch('https://raven.kr/')).text();
const measurementId = [...html.matchAll(/G-[A-Z0-9]{5,}/g)].map((m) => m[0])[0];
if (!measurementId)
  throw new Error('No public measurement ID found; no secrets are read by this probe.');
const events = await readFile(new URL('../src/lib/analytics/events.ts', import.meta.url), 'utf8');
const controller = await readFile(
  new URL('../src/lib/analytics/browser.ts', import.meta.url),
  'utf8',
);
const source =
  events.replace(/export /g, '') +
  '\n' +
  controller.replace(/^import .*\n/gm, '').replace(/export /g, '');
const code = ts
  .transpileModule(source + `\ninstallProductionAnalytics(${JSON.stringify(measurementId)});`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
  })
  .outputText.replace(/export \{\};?\s*$/, '');
const browser = await chromium.launch({ executablePath: process.env.CHROME_BIN, headless: true });
const sentinel = 'RAVEN_PRIVATE_SENTINEL';
const scenarios = [
  ['clean', '/', null],
  ['clean-spa', '/', 'spa'],
  ['initial-query', `/blog?q=${sentinel}`, null],
  ['initial-hash', `/blog#${sentinel}`, null],
  ['initial-admin', `/admin?token=${sentinel}`, null],
  ['initial-auth', `/auth/callback?code=${sentinel}`, null],
  ['query-latch', '/', 'query'],
  ['hash-latch', '/', 'hash'],
  ['admin-latch', '/', 'admin'],
  ['outbound', '/', 'outbound'],
  ['mail', '/', 'mail'],
  ['download', '/', 'download'],
  ['form', '/', 'form'],
  ['referrer', '/', 'referrer'],
  ['sdk-race', '/', 'race'],
];
const selectedScenarios = process.env.ANALYTICS_PROBE_CASES
  ? process.env.ANALYTICS_PROBE_CASES.split(',').map(
      (name) => scenarios.find(([candidate]) => candidate === name) ?? [name],
    )
  : scenarios;
const report = [];
try {
  for (const [name, path, action] of selectedScenarios) {
    if (!path) continue; // Unknown selections are rejected by the verdict below.
    const context = await browser.newContext({ serviceWorkers: 'block' });
    const packets = [];
    let sdkRequests = 0;
    await context.route('**/*', async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      if (url.origin === 'https://raven.kr' && request.isNavigationRequest()) {
        await route.fulfill({
          contentType: 'text/html',
          body: `<!doctype html><html><head><title>${sentinel}</title></head><body><a id="outbound" href="https://example.test/?private=${sentinel}">external</a><a id="mail" href="mailto:${sentinel}@example.test">mail</a><a id="download" download href="/files/${sentinel}.pdf">${sentinel}</a><form action="https://example.test/${sentinel}"><input name="comment"><button type="submit">${sentinel}</button></form><script>document.addEventListener('click',e=>{if(e.target.closest('a'))e.preventDefault()});document.addEventListener('submit',e=>e.preventDefault());</script></body></html>`,
        });
      } else if (
        request.resourceType() === 'script' &&
        url.hostname === 'www.googletagmanager.com' &&
        /^\/gtag\/(js|destination)$/.test(url.pathname)
      ) {
        sdkRequests++;
        if (action === 'race') await new Promise((resolve) => setTimeout(resolve, 500));
        await route.continue();
      } else {
        packets.push({
          url: request.url(),
          body: request.postData() ?? '',
          headers: await request.allHeaders(),
        });
        if (
          process.env.ANALYTICS_PROBE_TRANSPORT === 'fulfill' &&
          url.pathname.includes('collect')
        ) {
          await route.fulfill({ status: 204, body: '' });
        } else await route.abort();
      }
    });
    const page = await context.newPage();
    await page.goto(`https://raven.kr${path}`, {
      referer: action === 'referrer' ? `https://raven.kr/blog?q=${sentinel}` : undefined,
    });
    await page.addScriptTag({ content: code });
    if (action === 'race')
      await page.evaluate((token) => history.pushState({}, '', `/blog?q=${token}`), sentinel);
    let timedOut = false;
    if (!name.startsWith('initial-')) {
      try {
        await page.waitForFunction(() => window.__ravenAnalytics?.loaded, undefined, {
          timeout: 20000,
        });
      } catch {
        timedOut = true;
      }
    }
    await page.waitForTimeout(1200);
    const before = packets.length;
    if (action === 'spa')
      await page.evaluate(() => history.pushState({}, '', '/blog/notes/example'));
    if (['query', 'hash', 'admin'].includes(action)) {
      await page.evaluate(
        ({ action, sentinel }) => {
          history.pushState(
            {},
            '',
            action === 'query'
              ? `/blog?q=${sentinel}`
              : action === 'hash'
                ? `/blog#${sentinel}`
                : `/admin?token=${sentinel}`,
          );
          history.pushState({}, '', '/blog');
          history.back();
        },
        { action, sentinel },
      );
      await page.waitForTimeout(150);
      await page.evaluate(() => history.forward());
    }
    if (['outbound', 'mail', 'download'].includes(action)) await page.locator(`#${action}`).click();
    if (action === 'form') {
      await page.locator('input').fill(sentinel);
      await page.locator('button').click();
    }
    if (
      ['query', 'hash', 'admin', 'outbound', 'mail', 'download', 'form', 'race'].includes(action)
    ) {
      await page.evaluate(() => {
        window.gtag?.('event', 'test_delayed', { test: 'RAVEN_PRIVATE_SENTINEL' });
        window.dispatchEvent(new Event('pagehide'));
        document.dispatchEvent(new Event('visibilitychange'));
      });
    }
    await page.waitForTimeout(1500);
    const state = await page.evaluate(() => ({
      blocked: window.__ravenAnalytics?.blocked,
      loaded: window.__ravenAnalytics?.loaded,
    }));
    const collect = packets.filter((packet) => new URL(packet.url).pathname.includes('collect'));
    const decoded = collect.map((packet) => {
      const params = new URLSearchParams(new URL(packet.url).search);
      for (const [key, value] of new URLSearchParams(packet.body)) params.set(key, value);
      return Object.fromEntries(params);
    });
    const leaks = packets.filter((packet) => {
      let wire = packet.url + '\n' + packet.body + '\n' + (packet.headers.referer ?? '');
      try {
        wire = decodeURIComponent(wire);
      } catch {
        /* Preserve malformed wire text. */
      }
      return wire.includes(sentinel);
    });
    report.push({
      name,
      sdkRequests,
      timedOut,
      ...state,
      packets: collect.length,
      packetsAfterInteraction: packets.length - before,
      pageviews: decoded.filter((item) => item.en === 'page_view').length,
      transports: collect.map((item, index) => ({
        host: new URL(item.url).host,
        path: new URL(item.url).pathname,
        tid: decoded[index].tid,
        sequence: decoded[index]._s,
        event: decoded[index].en,
      })),
      eventNames: decoded.map((item) => item.en),
      pageLocations: decoded.map((item) => item.dl),
      referrers: decoded.map((item) => item.dr ?? ''),
      httpReferrers: [...new Set(collect.map((item) => item.headers.referer ?? ''))],
      leakedPackets: leaks.length,
    });
    await context.close();
  }
} finally {
  await browser.close();
}
for (const result of report) {
  result.logicalPageviews = new Set(
    result.transports
      .filter((item) => item.event === 'page_view')
      .map((item) => `${item.tid}:${item.sequence}`),
  ).size;
}
// Count logical pageviews rather than transport retries from an aborted collect.
const expected = {
  clean: [false, true, 1, 'none'],
  'clean-spa': [false, true, 2, 'pageview'],
  'initial-query': [true, false, 0, 'none'],
  'initial-hash': [true, false, 0, 'none'],
  'initial-admin': [true, false, 0, 'none'],
  'initial-auth': [true, false, 0, 'none'],
  'query-latch': [true, true, 1, 'none'],
  'hash-latch': [true, true, 1, 'none'],
  'admin-latch': [true, true, 1, 'none'],
  outbound: [true, true, 1, 'none'],
  mail: [true, true, 1, 'none'],
  download: [true, true, 1, 'none'],
  form: [true, true, 1, 'none'],
  referrer: [false, true, 1, 'none'],
  'sdk-race': [true, true, 0, 'none'],
};
const failures = [];
if (!selectedScenarios.length) failures.push('No scenarios selected');
for (const [name] of selectedScenarios) {
  const rows = report.filter((row) => row.name === name);
  const expectation = expected[name];
  if (!expectation || rows.length !== 1) {
    failures.push(`${name}: unknown or unexecuted scenario`);
    continue;
  }
  const row = rows[0];
  const [blocked, loaded, pageviews, interaction] = expectation;
  if (
    row.timedOut ||
    row.leakedPackets !== 0 ||
    row.blocked !== blocked ||
    row.loaded !== loaded ||
    (loaded ? !(row.sdkRequests >= 1) : row.sdkRequests !== 0) ||
    row.logicalPageviews !== pageviews ||
    (pageviews === 0 && row.packets !== 0) ||
    (interaction === 'none'
      ? row.packetsAfterInteraction !== 0
      : !(row.packetsAfterInteraction > 0))
  )
    failures.push(`${name}: scenario expectations failed`);
}
const output = process.env.ANALYTICS_PROBE_OUTPUT ?? '/tmp/raven-analytics-privacy.json';
await writeFile(output, JSON.stringify(report, null, 2));
console.log(
  JSON.stringify({ output, scenarios: report.length, failures, results: report }, null, 2),
);
if (failures.length) process.exitCode = 1;
