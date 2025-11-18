/**
 * 숫자 포맷팅 유틸리티 함수
 */

/**
 * 숫자를 천 단위 콤마가 포함된 문자열로 변환
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('ko-KR');
}

/**
 * 숫자를 통화 형식으로 포맷팅 (원 단위)
 */
export function formatCurrency(num: number): string {
  return `${formatNumber(Math.round(num))}원`;
}

/**
 * 숫자를 통화 형식으로 포맷팅 (만원 단위)
 */
export function formatCurrencyManwon(num: number): string {
  return `${formatNumber(Math.round(num / 10000))}만원`;
}

/**
 * 숫자를 퍼센트 형식으로 포맷팅
 */
export function formatPercent(num: number, decimals = 2): string {
  return `${num.toFixed(decimals)}%`;
}

/**
 * 숫자를 간단한 형식으로 포맷팅 (예: 1.5억, 3천만)
 */
export function formatSimpleCurrency(num: number): string {
  const eok = Math.floor(num / 100000000);
  const man = Math.floor((num % 100000000) / 10000);
  const won = num % 10000;

  const parts: string[] = [];
  if (eok > 0) parts.push(`${eok}억`);
  if (man > 0) parts.push(`${man}만`);
  if (won > 0 && eok === 0 && man === 0) parts.push(`${formatNumber(won)}원`);

  return parts.join(' ') || '0원';
}

/**
 * 입력 필드용: 숫자를 천 단위 콤마가 포함된 문자열로 변환
 * 소수점이 있는 경우 소수점도 유지
 */
export function formatNumberInput(num: number): string {
  if (num === null || num === undefined || Number.isNaN(num)) return '';
  const numStr = String(num);
  
  // 소수점 처리
  const parts = numStr.split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];
  
  const formatted = formatNumber(Number(integerPart));
  return decimalPart !== undefined ? `${formatted}.${decimalPart}` : formatted;
}

/**
 * 입력 필드용: 콤마가 포함된 문자열을 숫자로 변환
 */
export function parseNumberInput(value: string): number {
  if (value === '' || value === null || value === undefined) return 0;
  const cleaned = value.replace(/,/g, '').trim();
  if (cleaned === '' || cleaned === '-') return 0;
  const parsed = parseFloat(cleaned);
  return Number.isNaN(parsed) ? 0 : parsed;
}
