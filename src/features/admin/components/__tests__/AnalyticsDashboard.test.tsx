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
});
