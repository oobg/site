import { describe, expect, it } from 'vitest';
import { formatDateKo } from './date';

describe('formatDateKo', () => {
  it('ISO 날짜를 한국어 날짜로 표시한다', () => {
    expect(formatDateKo('2026-06-24T00:00:00.000Z')).toMatch(/2026년 6월 24일/);
  });

  it('유효하지 않은 날짜는 조용히 잘못 표시하지 않는다', () => {
    expect(() => formatDateKo('not-a-date')).toThrow(RangeError);
  });

  it('서버나 방문자의 시간대와 관계없이 한국 날짜의 자정 경계를 따른다', () => {
    expect(formatDateKo('2026-06-23T14:59:59.000Z')).toBe('2026년 6월 23일');
    expect(formatDateKo('2026-06-23T15:00:00.000Z')).toBe('2026년 6월 24일');
  });

  it('시각이 없는 날짜는 입력한 일자를 그대로 표시한다', () => {
    expect(formatDateKo('2026-06-24')).toBe('2026년 6월 24일');
  });
});
