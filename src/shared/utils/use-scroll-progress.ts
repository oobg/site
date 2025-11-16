import { useEffect, useState } from 'react';

import { debounce } from './throttle';

/**
 * 스크롤 진행률을 계산하는 훅
 * 스크롤이 끝나는 시점에만 진행률을 업데이트
 * @returns 스크롤 진행률 (0-1)
 */
export function useScrollProgress(): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const calculateProgress = () => {
      const scrollTop = window.scrollY;
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollProgress = documentHeight > 0 ? scrollTop / documentHeight : 0;
      setProgress(Math.min(Math.max(scrollProgress, 0), 1));
    };

    // 스크롤 종료 시점에만 업데이트 (150ms 지연)
    const debouncedCalculateProgress = debounce(calculateProgress, 150);

    // 초기 진행률 계산
    calculateProgress();

    // 스크롤 이벤트 리스너 등록
    window.addEventListener('scroll', debouncedCalculateProgress, {
      passive: true,
    });

    // 리사이즈 이벤트도 처리 (페이지 높이 변경 시)
    window.addEventListener('resize', debouncedCalculateProgress, {
      passive: true,
    });

    return () => {
      window.removeEventListener('scroll', debouncedCalculateProgress);
      window.removeEventListener('resize', debouncedCalculateProgress);
    };
  }, []);

  return progress;
}
