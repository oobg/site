import { describe, it, expect } from 'vitest';
import { shouldPlayIntro, INTRO_STORAGE_KEY, INTRO_ATTR } from '@components/intro/introState';

describe('shouldPlayIntro', () => {
  it('pending 상태이고 모션 축소가 아니면 재생한다', () => {
    expect(shouldPlayIntro({ introState: 'pending', prefersReducedMotion: false })).toBe(true);
  });
  it('이미 본 세션(shown)이면 재생하지 않는다', () => {
    expect(shouldPlayIntro({ introState: 'shown', prefersReducedMotion: false })).toBe(false);
  });
  it('모션 축소 선호면 pending이어도 재생하지 않는다', () => {
    expect(shouldPlayIntro({ introState: 'pending', prefersReducedMotion: true })).toBe(false);
  });
  it('상태가 없으면(no-JS/미설정) 재생하지 않는다', () => {
    expect(shouldPlayIntro({ introState: undefined, prefersReducedMotion: false })).toBe(false);
  });
  it('상수를 노출한다', () => {
    expect(INTRO_STORAGE_KEY).toBe('ppos:intro-shown');
    expect(INTRO_ATTR).toBe('intro');
  });
});
