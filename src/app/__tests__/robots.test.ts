import { describe, expect, it } from 'vitest';

describe('robots', () => {
  it('keeps admin and API paths out of the public index', async () => {
    const { default: robots } = await import('@/app/robots');
    expect(robots()).toMatchObject({
      rules: { allow: '/', disallow: ['/admin', '/api'] },
      sitemap: 'https://raven.kr/sitemap.xml',
    });
  });
});
