/**
 * @vitest-environment jsdom
 * @vitest-environment-options {"url":"https://raven.kr/"}
 */
import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { pathname } = vi.hoisted(() => ({ pathname: { current: '/' } }));
vi.mock('next/navigation', () => ({ usePathname: () => pathname.current }));
vi.mock('@next/third-parties/google', () => ({
  GoogleAnalytics: ({ gaId }: { gaId: string }) => <div data-testid="google-analytics">{gaId}</div>,
}));

import {
  isAdminAnalyticsPath,
  isProductionAnalyticsOrigin,
  ProductionGoogleAnalytics,
} from '@components/analytics/ProductionGoogleAnalytics';

const measurementId = 'G-TEST';
const disableKey = `ga-disable-${measurementId}`;

describe('ProductionGoogleAnalytics', () => {
  beforeEach(() => {
    pathname.current = '/';
    window.history.replaceState({}, '', '/');
    Reflect.deleteProperty(window, disableKey);
  });

  it.each([
    ['/admin', true],
    ['/admin/', true],
    ['/admin/posts', true],
    ['/administrator', false],
    ['/blog/admin', false],
  ])('%s의 관리자 수집 제외 여부를 판정한다', (candidate, expected) => {
    expect(isAdminAnalyticsPath(candidate)).toBe(expected);
  });

  it('production hostname만 허용한다', () => {
    expect(isProductionAnalyticsOrigin('raven.kr')).toBe(true);
    expect(isProductionAnalyticsOrigin('www.raven.kr')).toBe(false);
    expect(isProductionAnalyticsOrigin('localhost')).toBe(false);
  });

  it('초기 관리자 경로에서는 GA를 렌더링하지 않고 수집을 비활성화한다', () => {
    pathname.current = '/admin/posts';
    window.history.replaceState({}, '', pathname.current);

    render(<ProductionGoogleAnalytics measurementId={measurementId} />);

    expect(screen.queryByTestId('google-analytics')).not.toBeInTheDocument();
    expect(Reflect.get(window, disableKey)).toBe(true);
  });

  it('공개 경로와 관리자 경로 사이의 client navigation에 앞서 수집 상태를 전환한다', () => {
    const view = render(<ProductionGoogleAnalytics measurementId={measurementId} />);

    expect(screen.getByTestId('google-analytics')).toHaveTextContent(measurementId);
    expect(Reflect.get(window, disableKey)).toBe(false);

    act(() => window.history.pushState({}, '', '/admin/posts'));
    expect(Reflect.get(window, disableKey)).toBe(true);

    pathname.current = '/admin/posts';
    view.rerender(<ProductionGoogleAnalytics measurementId={measurementId} />);
    expect(screen.queryByTestId('google-analytics')).not.toBeInTheDocument();

    act(() => window.history.pushState({}, '', '/administrator'));
    expect(Reflect.get(window, disableKey)).toBe(false);

    pathname.current = '/administrator';
    view.rerender(<ProductionGoogleAnalytics measurementId={measurementId} />);
    expect(screen.getByTestId('google-analytics')).toBeInTheDocument();
  });
});
