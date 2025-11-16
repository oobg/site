import { useEffect, useRef, useState } from 'react';

interface UseIntersectionObserverOptions {
  rootMargin?: string;
  threshold?: number | number[];
}

/**
 * IntersectionObserver를 래핑한 커스텀 훅
 * @param options - IntersectionObserver 옵션 (rootMargin, threshold)
 * @returns ref와 isIntersecting 상태
 */
export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {},
): [React.RefObject<HTMLDivElement | null>, boolean] {
  const { rootMargin = '200px', threshold = 0 } = options;
  const [isIntersecting, setIsIntersecting] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        rootMargin,
        threshold,
      },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [rootMargin, threshold]);

  return [elementRef, isIntersecting];
}
