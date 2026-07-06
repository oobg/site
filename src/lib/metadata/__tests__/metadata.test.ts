import { describe, it, expect } from 'vitest';
import { buildMetadata } from '@lib/metadata/metadata';

describe('buildMetadata', () => {
  it('base openGraph(siteName·type)를 병합한다', () => {
    const meta = buildMetadata({ title: '글제목', description: '요약', path: '/blog/x' });
    const og = meta.openGraph as Record<string, unknown>;
    expect(og.siteName).toBe('raven.kr');
    expect(og.type).toBe('website');
    expect(og.title).toBe('글제목');
    expect(og.url).toBe('/blog/x');
  });
});
