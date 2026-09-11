'use client';

import { useLayoutEffect, useSyncExternalStore } from 'react';
import { GoogleAnalytics } from '@next/third-parties/google';
import { usePathname } from 'next/navigation';

const PRODUCTION_HOSTNAME = 'raven.kr';
const subscribeToOrigin = () => () => {};
const getServerOrigin = () => false;
const getBrowserOrigin = () => isProductionAnalyticsOrigin(window.location.hostname);

export function isAdminAnalyticsPath(pathname: string) {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

export function isProductionAnalyticsOrigin(hostname: string) {
  return hostname === PRODUCTION_HOSTNAME;
}

function setAnalyticsDisabled(measurementId: string, pathname: string) {
  Object.assign(window, {
    [`ga-disable-${measurementId}`]: isAdminAnalyticsPath(pathname),
  });
}

function getNavigationPathname(url: string | URL | null | undefined) {
  return url == null ? window.location.pathname : new URL(url, window.location.href).pathname;
}

export function ProductionGoogleAnalytics({ measurementId }: { measurementId: string }) {
  const pathname = usePathname();
  const isProductionOrigin = useSyncExternalStore(
    subscribeToOrigin,
    getBrowserOrigin,
    getServerOrigin,
  );

  useLayoutEffect(() => {
    if (!isProductionOrigin) return;

    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    const syncBeforeNavigation = (url?: string | URL | null) => {
      setAnalyticsDisabled(measurementId, getNavigationPathname(url));
    };
    const pushState: History['pushState'] = function (this: History, data, unused, url) {
      syncBeforeNavigation(url);
      return originalPushState.call(this, data, unused, url);
    };
    const replaceState: History['replaceState'] = function (this: History, data, unused, url) {
      syncBeforeNavigation(url);
      return originalReplaceState.call(this, data, unused, url);
    };
    const handlePopState = () => syncBeforeNavigation();

    // Install the history guard before GoogleAnalytics' passive effects initialize gtag.
    // This cannot retract an already-sent hit, but it disables GA before client navigations
    // enter /admin and keeps browser collection separate from server-side GA4 Data API reads.
    syncBeforeNavigation();
    window.history.pushState = pushState;
    window.history.replaceState = replaceState;
    window.addEventListener('popstate', handlePopState);

    return () => {
      if (window.history.pushState === pushState) window.history.pushState = originalPushState;
      if (window.history.replaceState === replaceState) {
        window.history.replaceState = originalReplaceState;
      }
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isProductionOrigin, measurementId]);

  useLayoutEffect(() => {
    if (isProductionOrigin) setAnalyticsDisabled(measurementId, pathname);
  }, [isProductionOrigin, measurementId, pathname]);

  return isProductionOrigin && !isAdminAnalyticsPath(pathname) ? (
    <GoogleAnalytics gaId={measurementId} />
  ) : null;
}
