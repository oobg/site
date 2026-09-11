'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';

const HISTORY_INDEX = '__ravenAdminHistoryIndex';
const LEAVE_MESSAGE = '저장하지 않은 변경이 있어요. 이 페이지를 나갈까요?';

type DirtyRegistry = {
  register: (source: symbol, dirty: boolean) => void;
};

const DirtyContext = createContext<DirtyRegistry | null>(null);

type NavigateEventLike = Event & {
  canIntercept?: boolean;
  downloadRequest?: string | null;
  navigationType?: string;
  destination?: { url?: string };
};

type NavigationLike = EventTarget;
type GuardWindow = Window & {
  navigation?: NavigationLike;
  __ravenAdminPopGuard?: ((event: PopStateEvent) => void) | null;
};

function historyIndex(state: unknown): number | null {
  if (typeof state !== 'object' || state === null || !(HISTORY_INDEX in state)) return null;
  const value = (state as Record<string, unknown>)[HISTORY_INDEX];
  return typeof value === 'number' ? value : null;
}

export function AdminNavigationProvider({ children }: { children: ReactNode }) {
  const dirtySources = useRef(new Set<symbol>());
  const dirtyRef = useRef(false);
  const bypassNavigationRef = useRef(false);
  const restoringTraversalRef = useRef(false);
  const currentHistoryIndexRef = useRef(0);
  const acceptedDestinationRef = useRef<string | null>(null);

  const register = useCallback((source: symbol, dirty: boolean) => {
    if (dirty) dirtySources.current.add(source);
    else dirtySources.current.delete(source);
    dirtyRef.current = dirtySources.current.size > 0;
  }, []);

  useEffect(() => {
    const existing = historyIndex(window.history.state);
    if (existing === null) {
      window.history.replaceState(
        { ...(window.history.state ?? {}), [HISTORY_INDEX]: currentHistoryIndexRef.current },
        '',
      );
    } else {
      currentHistoryIndexRef.current = existing;
    }

    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;
    window.history.pushState = function pushState(data, unused, url) {
      const next = currentHistoryIndexRef.current + 1;
      currentHistoryIndexRef.current = next;
      const result = originalPushState.call(
        this,
        { ...(data ?? {}), [HISTORY_INDEX]: next },
        unused,
        url,
      );
      bypassNavigationRef.current = false;
      acceptedDestinationRef.current = null;
      return result;
    };
    window.history.replaceState = function replaceState(data, unused, url) {
      return originalReplaceState.call(
        this,
        { ...(data ?? {}), [HISTORY_INDEX]: currentHistoryIndexRef.current },
        unused,
        url,
      );
    };
    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, []);

  useEffect(() => {
    const guardWindow = window as GuardWindow;
    const navigation = guardWindow.navigation;
    const hasEarlyPopGuard = '__ravenAdminPopGuard' in guardWindow;
    const confirmLeave = () => window.confirm(LEAVE_MESSAGE);

    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return;
      if (bypassNavigationRef.current) return;
      event.preventDefault();
      event.returnValue = '';
    };

    const click = (event: MouseEvent) => {
      if (
        !dirtyRef.current ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const origin = event.target;
      const link = origin instanceof Element ? origin.closest('a[href]') : null;
      if (!(link instanceof HTMLAnchorElement)) return;
      const destination = new URL(link.href, window.location.href);
      const current = new URL(window.location.href);
      if (
        link.download ||
        (link.target && link.target !== '_self') ||
        (destination.origin === current.origin &&
          destination.pathname === current.pathname &&
          destination.search === current.search &&
          destination.hash === current.hash)
      )
        return;
      if (!confirmLeave()) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      bypassNavigationRef.current = true;
      acceptedDestinationRef.current = destination.href;
    };

    const navigate = (event: Event) => {
      const navigationEvent = event as NavigateEventLike;
      if (navigationEvent.navigationType === 'traverse') return;
      const destinationUrl = navigationEvent.destination?.url;
      if (
        destinationUrl &&
        new URL(destinationUrl, window.location.href).href === window.location.href
      )
        return;
      if (bypassNavigationRef.current && destinationUrl === acceptedDestinationRef.current) {
        bypassNavigationRef.current = false;
        acceptedDestinationRef.current = null;
        return;
      }
      if (
        !dirtyRef.current ||
        !event.cancelable ||
        navigationEvent.canIntercept === false ||
        navigationEvent.downloadRequest ||
        confirmLeave()
      )
        return;
      event.preventDefault();
    };

    const popState = (event: PopStateEvent) => {
      const targetIndex = historyIndex(event.state);
      if (restoringTraversalRef.current) {
        restoringTraversalRef.current = false;
        if (targetIndex !== null) currentHistoryIndexRef.current = targetIndex;
        event.stopImmediatePropagation();
        return;
      }
      if (!dirtyRef.current || confirmLeave()) {
        if (targetIndex !== null) currentHistoryIndexRef.current = targetIndex;
        return;
      }

      const currentIndex = currentHistoryIndexRef.current;
      const restoreDelta = targetIndex === null ? 1 : currentIndex - targetIndex;
      event.stopImmediatePropagation();
      restoringTraversalRef.current = true;
      window.history.go(restoreDelta || 1);
    };

    window.addEventListener('beforeunload', beforeUnload);
    document.addEventListener('click', click, true);
    if (navigation) navigation.addEventListener('navigate', navigate);
    if (hasEarlyPopGuard) guardWindow.__ravenAdminPopGuard = popState;
    else window.addEventListener('popstate', popState, true);
    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
      document.removeEventListener('click', click, true);
      if (navigation) navigation.removeEventListener('navigate', navigate);
      if (hasEarlyPopGuard) {
        if (guardWindow.__ravenAdminPopGuard === popState) guardWindow.__ravenAdminPopGuard = null;
      } else {
        window.removeEventListener('popstate', popState, true);
      }
    };
  }, []);

  const value = useMemo(() => ({ register }), [register]);
  return <DirtyContext.Provider value={value}>{children}</DirtyContext.Provider>;
}

export function useAdminNavigationGuard(dirty: boolean): void {
  const registry = useContext(DirtyContext);
  const source = useRef(Symbol('admin-dirty-source'));
  useEffect(() => {
    const currentSource = source.current;
    registry?.register(currentSource, dirty);
    return () => registry?.register(currentSource, false);
  }, [dirty, registry]);
}
