import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AnalyticsDashboard } from '@features/admin/components/AnalyticsDashboard';

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

  it('인기 페이지에서 관리자 경로를 숨기고 위치별 집계를 보여준다', () => {
    render(
      <AnalyticsDashboard
        result={{
          status: 'ready',
          data: {
            range: { startDate: '27daysAgo', endDate: 'today', days: 28 },
            summary: { activeUsers: 12, sessions: 18, screenPageViews: 30, engagementRate: 0.5 },
            daily: [],
            channels: [],
            pages: [
              { path: '/admin', title: '관리자', views: 100, activeUsers: 50 },
              { path: '/blog/notes/post-1', title: '공개 글', views: 20, activeUsers: 10 },
            ],
            devices: [],
            locations: {
              countries: [{ name: '대한민국', activeUsers: 10, sessions: 12, views: 30 }],
              regions: [{ name: '서울특별시 · 대한민국', activeUsers: 9, sessions: 10, views: 22 }],
              cities: [
                { name: '서울 · 서울특별시 · 대한민국', activeUsers: 8, sessions: 9, views: 18 },
              ],
            },
          },
        }}
      />,
    );
    expect(screen.queryByText('/admin')).not.toBeInTheDocument();
    expect(screen.getByText('/blog/notes/post-1')).toBeInTheDocument();
    expect(screen.getByText('대한민국')).toBeInTheDocument();
    expect(screen.getByText('서울특별시 · 대한민국')).toBeInTheDocument();
  });
});
