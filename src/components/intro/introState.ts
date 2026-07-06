/** sessionStorage 키 — 세션당 1회 재생 게이팅. */
export const INTRO_STORAGE_KEY = 'ppos:intro-shown';

/** <html>에 세팅되는 data 속성명 (document.documentElement.dataset.intro). */
export const INTRO_ATTR = 'intro';

/**
 * 도입부 안무를 재생할지 결정한다.
 * - introState: 인라인 스크립트가 세팅한 'pending' | 'shown' | undefined.
 * - prefersReducedMotion: 사용자의 모션 축소 선호.
 */
export function shouldPlayIntro(input: {
  introState: string | undefined;
  prefersReducedMotion: boolean;
}): boolean {
  return input.introState === 'pending' && !input.prefersReducedMotion;
}
