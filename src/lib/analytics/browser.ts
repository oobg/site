import { isPublicEvent, type PublicEvent } from './events';

type Gtag = (...args: unknown[]) => void;
type AnalyticsController = {
  measurementId: string;
  blocked: boolean;
  loaded: boolean;
  sync: (url?: string | URL | null) => void;
  track: (name: PublicEvent, value: string) => void;
};

declare global {
  interface Window {
    __ravenAnalytics?: AnalyticsController;
    dataLayer?: unknown[];
    gtag?: Gtag;
  }
}

export function isAdminAnalyticsPath(pathname: string) {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

export function isProductionAnalyticsOrigin(hostname: string) {
  return hostname === 'raven.kr';
}

export function isCollectableUrl(url: URL) {
  return (
    url.protocol === 'https:' &&
    isProductionAnalyticsOrigin(url.hostname) &&
    !url.port &&
    !url.username &&
    !url.password &&
    !url.search &&
    !url.hash &&
    /^(?:\/?|\/about\/?|\/blog(?:\/[^/]+){0,2}\/?|\/projects(?:\/[^/]+)?\/?)$/.test(url.pathname)
  );
}

function safePage(url: URL) {
  return {
    page_location: `${url.origin}${url.pathname}`,
    page_referrer: '',
    page_title:
      url.pathname === '/'
        ? 'raven'
        : url.pathname.startsWith('/blog/')
          ? '글 | raven'
          : url.pathname.startsWith('/projects')
            ? '프로젝트 | raven'
            : url.pathname.startsWith('/about')
              ? '소개 | raven'
              : '글 목록 | raven',
  };
}

/**
 * Lives for the document, not the React mount. Private navigation permanently
 * disables this document, including delayed SDK events and BFCache returns.
 * Keeps GA's existing automatic page-view engine.
 */
export function installProductionAnalytics(measurementId: string) {
  if (!/^G-[A-Z0-9]+$/.test(measurementId) || !isProductionAnalyticsOrigin(location.hostname))
    return;
  if (window.__ravenAnalytics) return window.__ravenAnalytics;

  const disableKey = `ga-disable-${measurementId}`;
  const controller: AnalyticsController = {
    measurementId,
    blocked: false,
    loaded: false,
    sync(url) {
      let destination: URL;
      try {
        destination = new URL(url ?? location.href, location.href);
      } catch {
        block();
        return;
      }
      if (!isCollectableUrl(destination)) block();
      if (!controller.blocked && window.gtag) window.gtag('set', safePage(destination));
    },
    track(name, value) {
      controller.sync();
      if (controller.blocked || !controller.loaded || !isPublicEvent(name, value)) return;
      window.gtag?.('event', name, { interaction: value, ...safePage(new URL(location.href)) });
    },
  };
  function block() {
    controller.blocked = true;
    Object.assign(window, { [disableKey]: true });
  }
  window.__ravenAnalytics = controller;
  Object.assign(window, { [disableKey]: false });
  controller.sync();

  // Keep guards across React cleanup/remount: the vendor SDK can outlive it.
  const push = history.pushState;
  const replace = history.replaceState;
  history.pushState = function (data, unused, url) {
    controller.sync(url);
    return push.call(this, data, unused, url);
  };
  history.replaceState = function (data, unused, url) {
    controller.sync(url);
    return replace.call(this, data, unused, url);
  };
  for (const event of ['popstate', 'hashchange', 'pageshow']) {
    window.addEventListener(event, () => controller.sync(), true);
  }
  // Capture before SDK listeners can inspect a sensitive destination.
  document.addEventListener(
    'click',
    (event) => {
      const target = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!(target instanceof HTMLAnchorElement)) return;
      try {
        const destination = new URL(target.href, location.href);
        if (!isCollectableUrl(destination) || target.hasAttribute('download')) block();
      } catch {
        block();
      }
      if (target.dataset.trackEvent === 'related_article_open' && target.dataset.trackSource) {
        controller.track('related_article_open', target.dataset.trackSource);
      }
    },
    true,
  );
  // Form measurement is configured outside the repo. Suppress before visitor
  // input instead of forwarding form metadata from an unknown configuration.
  for (const eventName of ['focusin', 'input', 'change']) {
    document.addEventListener(
      eventName,
      (event) => {
        if (event.target instanceof Element && event.target.closest('form')) block();
      },
      true,
    );
  }
  document.addEventListener('submit', () => block(), true);

  if (controller.blocked) return controller;
  window.dataLayer = window.dataLayer ?? [];
  window.gtag =
    window.gtag ??
    function () {
      // eslint-disable-next-line prefer-rest-params -- Preserve the documented gtag arguments queue.
      window.dataLayer?.push(arguments);
    };
  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    ...safePage(new URL(location.href)),
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });
  const script = document.createElement('script');
  script.id = 'raven-google-analytics';
  script.async = true;
  script.setAttribute('referrerpolicy', 'no-referrer');
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  script.addEventListener('load', () => {
    controller.loaded = true;
    controller.sync();
  });
  document.head.appendChild(script);
  return controller;
}
