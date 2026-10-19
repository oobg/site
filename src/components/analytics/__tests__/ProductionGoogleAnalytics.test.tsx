/**
 * @vitest-environment jsdom
 * @vitest-environment-options {"url":"https://raven.kr/"}
 */
import { StrictMode } from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProductionGoogleAnalytics } from '@components/analytics/ProductionGoogleAnalytics';
import { isCollectableUrl, installProductionAnalytics } from '@lib/analytics/browser';
import { trackPublicEvent } from '@lib/analytics/events';

const measurementId = 'G-TEST';
const disableKey = `ga-disable-${measurementId}`;
const originalPush = window.history.pushState;
const originalReplace = window.history.replaceState;
const listeners: Array<() => void> = [];

beforeEach(() => {
  originalReplace.call(history, {}, '', '/');
  for (const target of [window, document]) {
    const original = target.addEventListener.bind(target);
    vi.spyOn(target, 'addEventListener').mockImplementation((type, listener, options) => {
      original(type, listener, options);
      listeners.push(() => target.removeEventListener(type, listener, options));
    });
  }
});
afterEach(() => {
  cleanup();
  listeners.splice(0).forEach((remove) => remove());
  vi.restoreAllMocks();
  history.pushState = originalPush;
  history.replaceState = originalReplace;
  delete window.__ravenAnalytics;
  delete window.dataLayer;
  delete window.gtag;
  Reflect.deleteProperty(window, disableKey);
  document.getElementById('raven-google-analytics')?.remove();
});

const queue = () =>
  (window.dataLayer ?? []).map((entry) => Array.from(entry as ArrayLike<unknown>));
const loaded = () =>
  document.getElementById('raven-google-analytics')?.dispatchEvent(new Event('load'));

describe('production analytics document boundary', () => {
  it.each([
    '/admin',
    '/admin/posts/new',
    '/auth/callback?code=private',
    '/blog?q=private',
    '/blog#private',
    '/unknown',
  ])('does not load the SDK on %s', (path) => {
    history.replaceState({}, '', path);
    render(<ProductionGoogleAnalytics measurementId={measurementId} />);
    expect(document.getElementById('raven-google-analytics')).toBeNull();
    expect(Reflect.get(window, disableKey)).toBe(true);
    expect(window.dataLayer).toBeUndefined();
  });

  it('initializes a clean page once across StrictMode and remounts, retaining automatic page views', () => {
    const view = render(
      <StrictMode>
        <ProductionGoogleAnalytics measurementId={measurementId} />
      </StrictMode>,
    );
    expect(queue().filter(([type]) => type === 'config')).toHaveLength(1);
    expect(queue().find(([type]) => type === 'config')?.[2]).toEqual({
      page_location: 'https://raven.kr/',
      page_referrer: '',
      page_title: 'raven',
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    });
    expect(document.getElementById('raven-google-analytics')).toHaveAttribute(
      'referrerpolicy',
      'no-referrer',
    );
    view.unmount();
    render(<ProductionGoogleAnalytics measurementId={measurementId} />);
    expect(queue().filter(([type]) => type === 'config')).toHaveLength(1);
    expect(Reflect.get(window, disableKey)).toBe(false);
  });

  it.each(['pushState', 'replaceState'] as const)(
    'latches before %s changes the URL and stays disabled after returning',
    (method) => {
      installProductionAnalytics(measurementId);
      loaded();
      act(() => history[method]({}, '', '/blog?q=private'));
      expect(Reflect.get(window, disableKey)).toBe(true);
      act(() => history[method]({}, '', '/blog'));
      installProductionAnalytics(measurementId);
      trackPublicEvent('article_share', 'copy');
      expect(Reflect.get(window, disableKey)).toBe(true);
      expect(queue().filter(([type]) => type === 'event')).toHaveLength(0);
    },
  );

  it('allows only enum events after the SDK has loaded', () => {
    installProductionAnalytics(measurementId);
    trackPublicEvent('search_open', 'header');
    expect(queue().filter(([type]) => type === 'event')).toHaveLength(0);
    loaded();
    trackPublicEvent('search_open', 'header');
    // Runtime callers do not get to bypass the TypeScript contract.
    window.__ravenAnalytics?.track('article_share', 'private@example.test');
    expect(queue().filter(([type]) => type === 'event')).toEqual([
      [
        'event',
        'search_open',
        {
          interaction: 'header',
          page_location: 'https://raven.kr/',
          page_referrer: '',
          page_title: 'raven',
        },
      ],
    ]);
  });

  it('captures related links once and blocks unsafe destinations before bubbling', () => {
    installProductionAnalytics(measurementId);
    loaded();
    const link = document.createElement('a');
    link.href = '/blog/notes/example';
    link.dataset.trackEvent = 'related_article_open';
    link.dataset.trackSource = 'next';
    link.addEventListener('click', (event) => event.preventDefault());
    document.body.appendChild(link);
    link.click();
    expect(queue().filter(([type]) => type === 'event')).toHaveLength(1);
    link.href = 'https://example.test/?secret=private';
    link.addEventListener('click', () => expect(Reflect.get(window, disableKey)).toBe(true));
    link.click();
    expect(queue().filter(([type]) => type === 'event')).toHaveLength(1);
    link.remove();
  });

  it('blocks form metadata before interaction and does not revive on pageshow', () => {
    installProductionAnalytics(measurementId);
    const form = document.createElement('form');
    form.innerHTML = '<input name="comment">';
    document.body.appendChild(form);
    form.querySelector('input')?.focus();
    window.dispatchEvent(new Event('pageshow'));
    loaded();
    expect(Reflect.get(window, disableKey)).toBe(true);
    form.remove();
  });

  it.each([
    'https://dev.raven.kr/',
    'https://raven.kr:444/',
    'http://raven.kr/',
    'https://raven.kr/api/docs',
    'https://raven.kr/?utm_source=private',
  ])('rejects %s', (url) => {
    expect(isCollectableUrl(new URL(url))).toBe(false);
  });
});
