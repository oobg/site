import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * 주소창의 해시값을 감지하여 해당 위치로 부드럽게 스크롤하는 훅
 * @param enabled - 해시 스크롤을 실행할지 여부 (데이터 로딩 완료 여부 등)
 */
export function useScrollToHash(enabled = true) {
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash || !enabled) return;

    // hash → "#section1" → "section1"
    // URL 인코딩된 ID를 디코딩
    const rawId = hash.replace('#', '');
    const decodedId = decodeURIComponent(rawId);

    // 마크다운이 완전히 렌더링될 때까지 딜레이
    const scrollToElement = () => {
      // 인코딩된 ID와 디코딩된 ID 모두 시도
      const el = document.getElementById(decodedId) || document.getElementById(rawId);

      if (!el) return;

      // 헤더 높이 고려
      const headerOffset = 80;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      // 렌더 타이밍 보장 (특히 Suspense/loader)
      requestAnimationFrame(() => {
        window.scrollTo({
          top: Math.max(0, offsetPosition),
          behavior: 'smooth',
        });
      });
    };

    // 마크다운 렌더링을 위한 딜레이
    setTimeout(() => {
      scrollToElement();
    }, 500);
  }, [hash, enabled]);
}

/**
 * 주소창의 해시값을 감지하여 해당 위치로 부드럽게 스크롤하는 컴포넌트
 */
export const HashScroll = () => {
  useScrollToHash();
  return null;
};
