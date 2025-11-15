import { DATE_FORMAT_OPTIONS, LOCALE } from '@src/shared/constants/config';

/**
 * 날짜를 로케일 형식으로 포맷팅
 * @param date - 포맷팅할 날짜 (문자열 또는 Date 객체)
 * @returns 포맷팅된 날짜 문자열
 */
export function formatDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString(LOCALE, DATE_FORMAT_OPTIONS);
}

/**
 * 날짜와 시간을 로케일 형식으로 포맷팅
 * @param date - 포맷팅할 날짜 (문자열 또는 Date 객체)
 * @returns 포맷팅된 날짜/시간 문자열
 */
export function formatDateTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleString(LOCALE, {
    ...DATE_FORMAT_OPTIONS,
    hour: '2-digit',
    minute: '2-digit',
  });
}
