import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AnalyticsDashboard } from '@features/admin/components/AnalyticsDashboard';

vi.mock('cobe', () => ({
  default: () => ({ destroy: vi.fn(), update: vi.fn() }),
}));

describe('AnalyticsDashboard', () => {
  it('설정되지 않은 서버 변수만 정확히 안내한다', () => {
    render(
      <AnalyticsDashboard result={{ status: 'not-configured', missing: ['GA4_PRIVATE_KEY'] }} />,
    );
    expect(screen.getByText('GA4 Data API 설정이 필요해요.')).toBeInTheDocument();
    expect(screen.getByText(/GA4_PRIVATE_KEY/)).toBeInTheDocument();
  });

  it('정상 응답의 기간 집계와 빈 상태를 구분한다', () => {
    const { rerender } = render(
      <AnalyticsDashboard
        result={{ status: 'empty', range: { startDate: '27daysAgo', endDate: 'today', days: 28 } }}
      />,
    );
    expect(screen.getByText('아직 집계된 방문 통계가 없어요.')).toBeInTheDocument();
    expect(screen.getByText(/최근 28일 기준이며/)).toBeInTheDocument();
    rerender(
      <AnalyticsDashboard
        result={{ status: 'error', message: '방문 통계를 불러오지 못했어요.' }}
      />,
    );
    expect(screen.getByText('방문 통계를 불러오지 못했어요.')).toBeInTheDocument();
  });

  it('상세 분석 데이터를 Cloudflare 스타일의 밀도 높은 섹션으로 보여준다', () => {
    render(
      <AnalyticsDashboard
        result={{
          status: 'ready',
          data: {
            range: { startDate: '27daysAgo', endDate: 'today', days: 28 },
            summary: { activeUsers: 12, sessions: 18, screenPageViews: 40, engagementRate: 0.62 },
            daily: [
              {
                date: '20260916',
                activeUsers: 12,
                sessions: 18,
                screenPageViews: 40,
                engagementRate: 0.62,
              },
            ],
            channels: [{ name: 'Direct', sessions: 18 }],
            pages: [{ path: '/', title: '홈', views: 40, activeUsers: 12 }],
            devices: [
              { name: 'desktop', activeUsers: 8 },
              { name: 'mobile', activeUsers: 3 },
              { name: 'tablet', activeUsers: 1 },
            ],
            countries: [{ name: 'Korea, South', activeUsers: 10, sessions: 14 }],
            campaigns: [
              {
                source: 'google',
                medium: 'organic',
                campaign: 'launch',
                sessions: 8,
                activeUsers: 6,
              },
            ],
            browsers: [{ name: 'Chrome', activeUsers: 9, sessions: 12 }],
            operatingSystems: [{ name: 'Macintosh', activeUsers: 7, sessions: 9 }],
            visitorTypes: [{ name: 'new', activeUsers: 5, sessions: 7 }],
          },
        }}
      />,
    );

    expect(screen.getByText('디바이스 유형별 방문')).toBeInTheDocument();
    const deviceList = screen.getByLabelText('디바이스 유형별 활성 사용자');
    expect(deviceList).toBeInTheDocument();
    const deviceStage = screen.getByTestId('device-stage');
    const desktopButton = screen.getByRole('button', { name: /데스크톱/ });
    const mobileButton = screen.getByRole('button', { name: /모바일/ });
    const tabletButton = screen.getByRole('button', { name: /태블릿/ });
    expect(desktopButton).toHaveAttribute('aria-pressed', 'true');
    expect(mobileButton).toHaveAttribute('aria-pressed', 'false');
    expect(deviceStage).toHaveAttribute('data-active-device', 'desktop');

    fireEvent.pointerEnter(mobileButton);
    expect(deviceStage).toHaveAttribute('data-active-device', 'mobile');
    expect(desktopButton).toHaveAttribute('aria-pressed', 'true');
    expect(mobileButton).toHaveAttribute('aria-pressed', 'false');
    fireEvent.pointerLeave(deviceList);
    expect(deviceStage).toHaveAttribute('data-active-device', 'desktop');

    fireEvent.pointerEnter(mobileButton, { pointerType: 'touch' });
    expect(deviceStage).toHaveAttribute('data-active-device', 'desktop');
    fireEvent.click(mobileButton);
    expect(mobileButton).toHaveAttribute('aria-pressed', 'true');
    expect(desktopButton).toHaveAttribute('aria-pressed', 'false');
    expect(deviceStage).toHaveAttribute('data-active-device', 'mobile');

    fireEvent.keyDown(document, { key: 'Tab' });
    fireEvent.focus(tabletButton);
    expect(deviceStage).toHaveAttribute('data-active-device', 'tablet');
    expect(tabletButton).toHaveAttribute('aria-pressed', 'false');
    expect(mobileButton).toHaveAttribute('aria-pressed', 'true');
    fireEvent.keyDown(tabletButton, { key: 'Escape' });
    expect(deviceStage).toHaveAttribute('data-active-device', 'mobile');
    fireEvent.keyDown(tabletButton, { key: 'Enter' });
    expect(tabletButton).toHaveAttribute('aria-pressed', 'true');
    expect(deviceStage).toHaveAttribute('data-active-device', 'tablet');
    fireEvent.focus(desktopButton);
    fireEvent.keyDown(desktopButton, { key: ' ' });
    expect(desktopButton).toHaveAttribute('aria-pressed', 'true');
    expect(deviceStage).toHaveAttribute('data-active-device', 'desktop');

    expect(screen.getByText('전체 활성 사용자')).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: '국가별 활성 사용자를 표시한 지구본' }),
    ).toBeInTheDocument();
    const globeControl = screen.getByRole('button', { name: '회전 멈춤' });
    fireEvent.click(globeControl);
    expect(screen.getByRole('button', { name: '회전 시작' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByText('utm_campaign')).toBeInTheDocument();
    expect(screen.getByText('브라우저와 운영체제')).toBeInTheDocument();
  });
});
