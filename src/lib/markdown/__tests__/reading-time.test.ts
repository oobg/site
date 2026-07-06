import { describe, it, expect } from 'vitest';
import { computeReadingTime } from '@lib/markdown/reading-time';

describe('computeReadingTime', () => {
  it('단어 수를 분으로 환산한다(200 wpm, 반올림)', () => {
    const md = Array.from({ length: 400 }, () => 'word').join(' ');
    expect(computeReadingTime(md)).toBe(2);
  });
  it('짧은 글도 최소 1분', () => {
    expect(computeReadingTime('짧은 글')).toBe(1);
  });
});
