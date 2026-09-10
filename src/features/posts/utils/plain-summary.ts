/** 요약은 Markdown을 렌더하지 않으므로 인라인 코드 구분자만 걷어낸다. */
export function toPlainSummary(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.replace(/`([^`\n]+)`/g, '$1');
}
