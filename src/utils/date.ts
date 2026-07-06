const koFormatter = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

/** ISO 문자열을 '2026년 6월 24일' 형태로 표기한다. */
export function formatDateKo(iso: string): string {
  return koFormatter.format(new Date(iso));
}
