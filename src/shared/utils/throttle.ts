/**
 * throttle 함수: 일정 시간 간격으로 함수 실행을 제한
 * @param func - 실행할 함수
 * @param delay - 지연 시간 (밀리초)
 * @returns throttle된 함수
 */
export function throttle<T extends (...args: unknown[]) => void>(
  func: T,
  delay: number): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function throttled(...args: Parameters<T>) {
    const now = Date.now();

    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        func(...args);
      }, delay - (now - lastCall));
    }
  };
}

/**
 * debounce 함수: 연속된 호출을 지연시켜 마지막 호출만 실행
 * @param func - 실행할 함수
 * @param delay - 지연 시간 (밀리초)
 * @returns debounce된 함수
 */
export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  delay: number): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function debounced(...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
}
