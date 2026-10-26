/** Local, mock-content browser regression. No admin or write endpoints are used. */
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright'
);
const origin = process.env.HOME_PROBE_ORIGIN ?? 'http://localhost:3500';
assert(
  ['localhost', '127.0.0.1'].includes(new URL(origin).hostname),
  'Use a local mock-content server',
);
const browser = await chromium.launch({ executablePath: process.env.CHROME_BIN, headless: true });
const results = [];
try {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ]) {
    const page = await browser.newPage({ viewport, reducedMotion: 'reduce' });
    await page.goto(`${origin}/?view=all&page=2`);
    const first = page.getByRole('link', { name: '첫 페이지로 이동' });
    await first.waitFor();
    // Give the two-post mock document enough scroll range to measure alignment.
    // Only trailing test content is added; the header/archive geometry is unchanged.
    await page.evaluate(() => {
      const spacer = document.createElement('div');
      spacer.style.height = '200vh';
      document.body.append(spacer);
    });
    await first.click();
    await page.waitForURL((url) => url.searchParams.get('page') === null);
    await page.getByRole('heading', { name: '전체 글', exact: true }).waitFor();
    await page.waitForFunction(() => window.scrollY > 0);
    const position = await page.evaluate(() => {
      const heading = document.querySelector('main h1');
      const header = document.querySelector('header');
      return {
        headingTop: heading.getBoundingClientRect().top,
        headerBottom: header.getBoundingClientRect().bottom,
        scrollY,
        title: document.title,
      };
    });
    results.push({ viewport, ...position });
    await page.close();
  }
  console.log(JSON.stringify(results, null, 2));
  assert(
    results.every((row) => row.headingTop >= row.headerBottom),
    'List title is covered by the sticky header',
  );
} finally {
  await browser.close();
}
