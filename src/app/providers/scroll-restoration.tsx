import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { decodeHash, findElementByIds } from '@src/shared/utils/string';
import { scrollToElementWithAnimation } from '@src/shared/utils/scroll';
import {
  HASH_SCROLL_INITIAL_DELAY,
  HASH_SCROLL_MAX_DELAY,
  HASH_SCROLL_RETRY_INTERVAL,
} from '@src/shared/constants/ui';

/**
 * 주소창의 해시값을 감지하여 해당 위치로 부드럽게 스크롤하는 훅
 * @param enabled - 해시 스크롤을 실행할지 여부 (데이터 로딩 완료 여부 등)
 */
export function useScrollToHash(enabled = true) {
  const { hash } = useLocation();
  const retryCountRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!hash || !enabled) {
      retryCountRef.current = 0;
      return () => {
        // cleanup function for early return case
      };
    }

    // 이전 타이머 정리
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    retryCountRef.current = 0;

    // hash → "#section1" → "section1"
    // URL 인코딩된 ID를 디코딩
    const rawId = hash.replace('#', '');
    const decodedId = decodeHash(hash);

    const attemptScroll = () => {
      // 인코딩된 ID와 디코딩된 ID 모두 시도
      const element = findElementByIds([decodedId, rawId]);

      if (element) {
        // 요소를 찾았으면 스크롤 실행
        scrollToElementWithAnimation(decodedId);
        retryCountRef.current = 0;
        return true;
      }

      return false;
    };

    const scheduleScroll = (delay: number) => {
      timeoutRef.current = setTimeout(() => {
        if (attemptScroll()) {
          return;
        }

        // 요소를 찾지 못했으면 재시도
        const maxRetries = Math.floor(
          (HASH_SCROLL_MAX_DELAY - HASH_SCROLL_INITIAL_DELAY) / HASH_SCROLL_RETRY_INTERVAL,
        );

        if (retryCountRef.current < maxRetries) {
          retryCountRef.current += 1;
          scheduleScroll(HASH_SCROLL_RETRY_INTERVAL);
        }
      }, delay);
    };

    // 초기 딜레이 후 스크롤 시도
    scheduleScroll(HASH_SCROLL_INITIAL_DELAY);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      retryCountRef.current = 0;
    };
  }, [hash, enabled]);
}

/**
 * 주소창의 해시값을 감지하여 해당 위치로 부드럽게 스크롤하는 컴포넌트
 */
export const HashScroll = () => {
  useScrollToHash();
  return null;
};
