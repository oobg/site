/**
 * UI 관련 상수 정의
 */

/** 헤더 높이 (픽셀) */
export const HEADER_HEIGHT = 80;

/** 스크롤 버튼이 표시되는 최소 스크롤 위치 (픽셀) */
export const SCROLL_THRESHOLD = 300;

/** 해시 스크롤을 위한 최대 대기 시간 (밀리초) */
export const HASH_SCROLL_MAX_DELAY = 1000;

/** 해시 스크롤을 위한 초기 대기 시간 (밀리초) */
export const HASH_SCROLL_INITIAL_DELAY = 100;

/** 해시 스크롤 재시도 간격 (밀리초) */
export const HASH_SCROLL_RETRY_INTERVAL = 50;

/** 스크롤 애니메이션 동작 */
export const SCROLL_BEHAVIOR: ScrollBehavior = 'smooth';
