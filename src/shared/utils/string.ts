/**
 * 텍스트에서 slug를 생성 (rehypeSlug와 동일한 방식)
 * @param text - slug를 생성할 텍스트
 * @returns 생성된 slug
 */
export function createSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // 특수문자 제거
    .replace(/[\s_-]+/g, '-') // 공백, 언더스코어, 하이픈을 하이픈으로 통일
    .replace(/^-+|-+$/g, ''); // 앞뒤 하이픈 제거
}

/**
 * URL 해시에서 ID를 디코딩
 * @param hash - URL 해시 (예: "#section1" 또는 "section1")
 * @returns 디코딩된 ID
 */
export function decodeHash(hash: string): string {
  const rawId = hash.replace('#', '');
  return decodeURIComponent(rawId);
}

/**
 * 여러 ID 후보 중에서 존재하는 첫 번째 요소를 찾음
 * @param ids - 시도할 ID 배열
 * @returns 찾은 요소 또는 null
 */
export function findElementByIds(ids: string[]): HTMLElement | null {
  const foundElement = ids
    .map((id) => document.getElementById(id))
    .find((element) => element !== null);
  return foundElement || null;
}
