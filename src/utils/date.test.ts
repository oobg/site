import { describe, expect, it } from 'vitest';
import { formatDateKo } from './date';

describe('formatDateKo', () => {
  it('ISO 날짜를 한국어 날짜로 표시한다', () => {
    expect(formatDateKo('2026-06-24T00:00:00.000Z')).toMatch(/2026년 6월 24일/);
  });

  it('유효하지 않은 날짜는 조용히 잘못 표시하지 않는다', () => {
    expect(() => formatDateKo('not-a-date')).toThrow(RangeError);
  });
});
