import { HEADER_HEIGHT, SCROLL_BEHAVIOR } from '@src/shared/constants/ui';

/**
 * 헤더 높이를 반환
 * @returns 헤더 높이 (픽셀)
 */
export function getHeaderOffset(): number {
  return HEADER_HEIGHT;
}

/**
 * 특정 요소로 부드럽게 스크롤
 * @param elementId - 스크롤할 요소의 ID
 * @param offset - 추가 오프셋 (기본값: 헤더 높이)
 * @returns 스크롤 성공 여부
 */
export function scrollToElement(
  elementId: string,
  offset: number = getHeaderOffset(),
): boolean {
  const element = document.getElementById(elementId);
  if (!element) {
    return false;
  }

  const elementPosition = element.getBoundingClientRect().top;
  const offsetPosition = elementPosition + window.pageYOffset - offset;

  window.scrollTo({
    top: Math.max(0, offsetPosition),
    behavior: SCROLL_BEHAVIOR,
  });

  return true;
}

/**
 * requestAnimationFrame을 사용하여 스크롤 실행
 * @param elementId - 스크롤할 요소의 ID
 * @param offset - 추가 오프셋 (기본값: 헤더 높이)
 * @returns 스크롤 성공 여부
 */
export function scrollToElementWithAnimation(
  elementId: string,
  offset: number = getHeaderOffset(),
): boolean {
  const element = document.getElementById(elementId);
  if (!element) {
    return false;
  }

  requestAnimationFrame(() => {
    scrollToElement(elementId, offset);
  });

  return true;
}
