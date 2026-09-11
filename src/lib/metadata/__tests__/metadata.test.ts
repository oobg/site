import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildArticleMetadata, buildMetadata } from '@lib/metadata/metadata';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('buildMetadata', () => {
  it('base openGraph(siteName·type)를 병합한다', () => {
    const meta = buildMetadata({ title: '글제목', description: '요약', path: '/blog/dev/my-post' });
    const og = meta.openGraph as Record<string, unknown>;
    expect(og.siteName).toBe('raven.kr');
    expect(og.type).toBe('website');
    expect(og.title).toBe('글제목');
    expect(og.url).toBe('/blog/dev/my-post');
  });

  it('canonical과 설명 fallback을 함께 만든다', () => {
    const meta = buildMetadata({ title: '제목', path: '/about' });
    expect(meta.description).toBe('생각을 다듬고 시스템으로 만드는 과정을 기록하는 공간.');
    expect(meta.alternates).toMatchObject({
      canonical: '/about',
      types: { 'application/rss+xml': [{ url: '/rss.xml', title: 'raven.kr RSS' }] },
    });
    expect((meta.openGraph as Record<string, unknown>).description).toBe(
      '생각을 다듬고 시스템으로 만드는 과정을 기록하는 공간.',
    );
  });

  it('게시글 OG를 article로 표시하고 발행·수정 시간을 유지한다', () => {
    const meta = buildArticleMetadata({
      title: '글제목',
      description: '요약',
      path: '/blog/dev/my-post',
      publishedTime: '2026-09-01T00:00:00.000Z',
      modifiedTime: '2026-09-02T00:00:00.000Z',
    });
    expect(meta.openGraph).toMatchObject({
      type: 'article',
      publishedTime: '2026-09-01T00:00:00.000Z',
      modifiedTime: '2026-09-02T00:00:00.000Z',
    });
  });
});

describe('baseMetadata', () => {
  it('SITE_URL이 없으면 production origin과 검색 허용을 사용한다', async () => {
    vi.stubEnv('SITE_URL', '');
    const { baseMetadata } = await import('@lib/metadata/metadata');

    expect(baseMetadata.metadataBase).toEqual(new URL('https://raven.kr'));
    expect(baseMetadata.openGraph).toMatchObject({ url: 'https://raven.kr/' });
    expect(baseMetadata.robots).toMatchObject({ index: true, follow: true });
  });

  it('검색 정책을 hostname이 아니라 명시적 환경 변수에서 읽는다', async () => {
    vi.stubEnv('SITE_URL', 'https://dev.raven.kr');
    vi.stubEnv('SITE_INDEXABLE', 'false');
    const { baseMetadata } = await import('@lib/metadata/metadata');

    expect(baseMetadata.metadataBase).toEqual(new URL('https://dev.raven.kr'));
    expect(baseMetadata.openGraph).toMatchObject({ url: 'https://dev.raven.kr/' });
    expect(baseMetadata.robots).toMatchObject({ index: false, follow: false });
  });

  it('SITE_INDEXABLE이 없으면 hostname과 관계없이 기존 검색 허용을 유지한다', async () => {
    vi.stubEnv('SITE_URL', 'https://dev.raven.kr');
    vi.stubEnv('SITE_INDEXABLE', '');
    const { baseMetadata } = await import('@lib/metadata/metadata');
    expect(baseMetadata.robots).toMatchObject({ index: true, follow: true });
  });

  it('잘못된 SITE_INDEXABLE 값을 거부한다', async () => {
    vi.stubEnv('SITE_INDEXABLE', 'sometimes');
    await expect(import('@lib/metadata/metadata')).rejects.toThrow(
      'SITE_INDEXABLE은 true 또는 false여야 합니다.',
    );
  });

  it('잘못된 SITE_URL은 명확하게 거부한다', async () => {
    vi.stubEnv('SITE_URL', 'dev.raven.kr');

    await expect(import('@lib/metadata/metadata')).rejects.toThrow(
      'SITE_URL은 유효한 절대 HTTP(S) URL이어야 합니다.',
    );
  });
});
