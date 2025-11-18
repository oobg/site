import { useState } from 'react';

/**
 * 로컬스토리지와 동기화되는 상태를 관리하는 커스텀 훅
 * @param key - 로컬스토리지 키
 * @param initialValue - 초기값
 * @returns [storedValue, setValue] - 저장된 값과 값을 업데이트하는 함수
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((val: T) => T)) => void] {
  // 초기값을 함수로 받을 수 있도록 처리
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // 값을 업데이트하고 로컬스토리지에 저장하는 함수
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // 함수형 업데이트 지원
      const valueToStore = value instanceof Function ? value(storedValue) : value;

      setStoredValue(valueToStore);

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}
