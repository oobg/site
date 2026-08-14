import '@testing-library/jest-dom/vitest';

/* jsdom은 IntersectionObserver를 구현하지 않는다. SiteHeader가 스크롤 이벤트 대신
   이것으로 sticky 상태를 판별하므로, 없으면 마운트 즉시 ReferenceError가 난다.
   실제 브라우저는 전부 지원하는 API라 컴포넌트를 방어적으로 만드는 대신 여기서 채운다.
   관찰 결과를 흉내내지는 않는다 — 상태 전환을 검증하려는 테스트는 직접 콜백을 부른다. */
class IntersectionObserverStub implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = '';
  readonly thresholds: ReadonlyArray<number> = [];
  constructor(
    private readonly callback: IntersectionObserverCallback,
    readonly options?: IntersectionObserverInit,
  ) {}
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

globalThis.IntersectionObserver = IntersectionObserverStub;
