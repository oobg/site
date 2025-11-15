import React, {
  useState, useEffect, useCallback, useMemo,
} from 'react';
import { ArrowUpIcon } from '@src/shared/ui/icons';
import { SCROLL_THRESHOLD } from '@src/shared/constants/ui';
import { throttle } from '@src/shared/utils/throttle';

interface ScrollToTopProps {
  threshold?: number;
  className?: string;
  show?: boolean;
}

/**
 * 맨 위로 스크롤하는 버튼 컴포넌트
 * 스크롤 위치가 임계값을 넘으면 표시됩니다.
 */
export const ScrollToTop = React.memo(({
  threshold = SCROLL_THRESHOLD,
  className = '',
  show: controlledShow,
}: ScrollToTopProps) => {
  const [showScrollTop, setShowScrollTop] = useState(false);

  const updateScrollState = useCallback(() => {
    const { scrollY } = window;
    setShowScrollTop(scrollY > threshold);
  }, [threshold]);

  const handleScroll = useMemo(
    () => throttle(updateScrollState, 100),
    [updateScrollState],
  );

  useEffect(() => {
    // controlled 모드가 아닐 때만 내부 상태 관리
    if (controlledShow === undefined) {
      window.addEventListener('scroll', handleScroll, { passive: true });
      // 초기 상태 확인
      updateScrollState();
      return () => window.removeEventListener('scroll', handleScroll);
    }
    return undefined;
  }, [handleScroll, controlledShow, updateScrollState]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const isVisible = controlledShow !== undefined ? controlledShow : showScrollTop;

  return (
    <button
      type="button"
      onClick={scrollToTop}
      className={`rounded-full bg-primary-600 p-4 text-white shadow-lg transition-all duration-300 ease-in-out hover:bg-primary-500 hover:shadow-primary-500/50 ${
        isVisible
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-4 pointer-events-none'
      } ${className}`}
      aria-label="맨 위로 이동"
    >
      <ArrowUpIcon />
    </button>
  );
});

ScrollToTop.displayName = 'ScrollToTop';
