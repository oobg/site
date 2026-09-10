import { describe, expect, it } from 'vitest';
import { parsePostSeriesPosition } from '@features/posts/utils/series';

describe('parsePostSeriesPosition', () => {
  it('실제 연재 slug의 시리즈와 편 번호를 읽는다', () => {
    expect(parsePostSeriesPosition('design-system-00-prologue')).toEqual({
      series: 'design-system',
      number: 0,
    });
    expect(parsePostSeriesPosition('ai-memory-06-future')).toEqual({
      series: 'ai-memory',
      number: 6,
    });
  });

  it('번호가 명시되지 않은 slug를 추측하지 않는다', () => {
    expect(parsePostSeriesPosition('design-system-prologue')).toBeNull();
    expect(parsePostSeriesPosition('design-system-article-css-03')).toBeNull();
    expect(parsePostSeriesPosition('release-2026-post')).toBeNull();
  });
});
