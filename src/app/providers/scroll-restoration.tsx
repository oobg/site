import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const SCROLL_POSITION_KEY = 'scrollPositions';

interface ScrollPositions {
  [key: string]: number;
}

const getScrollPositions = (): ScrollPositions => {
  try {
    const stored = sessionStorage.getItem(SCROLL_POSITION_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const saveScrollPosition = (path: string, position: number) => {
  try {
    const positions = getScrollPositions();
    positions[path] = position;
    sessionStorage.setItem(SCROLL_POSITION_KEY, JSON.stringify(positions));
  } catch {
    // sessionStorage가 사용 불가능한 경우 무시
  }
};

const getScrollPosition = (path: string): number | null => {
  try {
    const positions = getScrollPositions();
    return positions[path] ?? null;
  } catch {
    return null;
  }
};

export const ScrollRestoration = () => {
  const location = useLocation();
  const navigationType = useNavigationType();
  const previousPathRef = useRef<string>('');

  useEffect(() => {
    const currentPath = `${location.pathname}${location.search}`;

    // 이전 경로의 스크롤 위치 저장
    if (previousPathRef.current && previousPathRef.current !== currentPath) {
      const { scrollY } = window;
      saveScrollPosition(previousPathRef.current, scrollY);
    }

    // 현재 경로로의 스크롤 처리
    if (navigationType === 'POP') {
      // 뒤로가기/앞으로가기: 저장된 스크롤 위치로 복원
      const savedPosition = getScrollPosition(currentPath);
      if (savedPosition !== null) {
        // 약간의 지연을 두어 DOM이 완전히 렌더링된 후 스크롤 복원
        requestAnimationFrame(() => {
          window.scrollTo(0, savedPosition);
        });
      } else {
        // 저장된 위치가 없으면 맨 위로
        window.scrollTo(0, 0);
      }
    } else {
      // PUSH/REPLACE: 맨 위로 이동
      window.scrollTo(0, 0);
    }

    // 현재 경로를 이전 경로로 업데이트
    previousPathRef.current = currentPath;
  }, [location.pathname, location.search, navigationType]);

  return null;
};
