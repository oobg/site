import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ requireOwner: vi.fn(), batchRunReports: vi.fn() }));
vi.mock('@lib/auth/owner', () => ({ requireOwner: mocks.requireOwner }));
vi.mock('next/cache', () => ({ unstable_cache: (fn: unknown) => fn }));
vi.mock('@google-analytics/data', () => ({
  BetaAnalyticsDataClient: class {
    batchRunReports = mocks.batchRunReports;
  },
}));

import { fillDailyRange, getAnalyticsDashboard } from '@features/admin/services/analytics.admin';

const metric = (value: string) => ({ value });
const dimension = (value: string) => ({ value });

describe('GA4 analytics service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GA4_PROPERTY_ID = '461865918';
    process.env.GA4_CLIENT_EMAIL = 'reader@example.com';
    process.env.GA4_PRIVATE_KEY = 'private-key';
    delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
    mocks.requireOwner.mockResolvedValue(undefined);
  });

  it('checks owner access before reading cached analytics', async () => {
    mocks.requireOwner.mockRejectedValue(new Error('denied'));
    await expect(getAnalyticsDashboard()).rejects.toThrow('denied');
    expect(mocks.batchRunReports).not.toHaveBeenCalled();
  });

  it('uses the aggregate active user metric instead of summing daily users', async () => {
    mocks.batchRunReports.mockResolvedValue([
      {
        reports: [
          { rows: [{ metricValues: [metric('3'), metric('8'), metric('14'), metric('0.5')] }] },
          {
            metadata: { timeZone: 'Asia/Seoul' },
            rows: [
              {
                dimensionValues: [dimension('20260910')],
                metricValues: [metric('3'), metric('4')],
              },
              {
                dimensionValues: [dimension('20260911')],
                metricValues: [metric('3'), metric('4')],
              },
            ],
          },
          { rows: [] },
          { rows: [] },
          { rows: [] },
        ],
      },
    ]);
    const result = await getAnalyticsDashboard();
    expect(result.status).toBe('ready');
    if (result.status === 'ready') expect(result.data.summary.activeUsers).toBe(3);
  });

  it('does not report empty when views exist without active users', async () => {
    mocks.batchRunReports.mockResolvedValue([
      {
        reports: [
          { rows: [{ metricValues: [metric('0'), metric('0'), metric('2'), metric('0')] }] },
          { metadata: { timeZone: 'Asia/Seoul' }, rows: [] },
          { rows: [] },
          { rows: [] },
          { rows: [] },
        ],
      },
    ]);
    expect((await getAnalyticsDashboard()).status).toBe('ready');
  });

  it('loads cached country, region, and city reports while excluding admin pages', async () => {
    mocks.batchRunReports
      .mockResolvedValueOnce([
        {
          reports: [
            { rows: [{ metricValues: [metric('3'), metric('8'), metric('14'), metric('0.5')] }] },
            { metadata: { timeZone: 'Asia/Seoul' }, rows: [] },
            { rows: [] },
            {
              rows: [
                {
                  dimensionValues: [dimension('/admin'), dimension('관리자')],
                  metricValues: [metric('100'), metric('50')],
                },
                {
                  dimensionValues: [dimension('/blog/notes/post-1'), dimension('공개 글')],
                  metricValues: [metric('20'), metric('10')],
                },
              ],
            },
            { rows: [] },
          ],
        },
      ])
      .mockResolvedValueOnce([
        {
          reports: [
            {
              rows: [
                {
                  dimensionValues: [dimension('대한민국')],
                  metricValues: [metric('10'), metric('12'), metric('30')],
                },
              ],
            },
            {
              rows: [
                {
                  dimensionValues: [dimension('대한민국'), dimension('서울특별시')],
                  metricValues: [metric('9'), metric('10'), metric('22')],
                },
              ],
            },
            {
              rows: [
                {
                  dimensionValues: [
                    dimension('대한민국'),
                    dimension('서울특별시'),
                    dimension('서울'),
                  ],
                  metricValues: [metric('8'), metric('9'), metric('18')],
                },
              ],
            },
          ],
        },
      ]);

    const result = await getAnalyticsDashboard();

    expect(result.status).toBe('ready');
    if (result.status === 'ready') {
      expect(result.data.pages).toEqual([
        { path: '/blog/notes/post-1', title: '공개 글', views: 20, activeUsers: 10 },
      ]);
      expect(result.data.locations).toEqual({
        countries: [{ name: '대한민국', activeUsers: 10, sessions: 12, views: 30 }],
        regions: [{ name: '서울특별시 · 대한민국', activeUsers: 9, sessions: 10, views: 22 }],
        cities: [{ name: '서울 · 서울특별시 · 대한민국', activeUsers: 8, sessions: 9, views: 18 }],
      });
    }
    expect(mocks.batchRunReports).toHaveBeenCalledTimes(2);
    const pageRequest = mocks.batchRunReports.mock.calls[0][0].requests[3];
    expect(pageRequest.dimensionFilter.andGroup.expressions).toHaveLength(2);
    expect(mocks.batchRunReports.mock.calls[1][0].requests).toHaveLength(3);
  });

  it('returns a safe error state when the API rejects', async () => {
    mocks.batchRunReports.mockRejectedValue(Object.assign(new Error('secret detail'), { code: 7 }));
    expect(await getAnalyticsDashboard()).toEqual({
      status: 'error',
      message: '방문 통계를 불러오지 못했어요.',
    });
  });

  it('fills missing property-timezone dates with zero values', () => {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());
    const today = ['year', 'month', 'day']
      .map((type) => parts.find((part) => part.type === type)?.value)
      .join('');
    const rows = fillDailyRange([{ date: today, activeUsers: 1, sessions: 2 }], 'Asia/Seoul', 2);
    expect(rows).toHaveLength(2);
    expect(rows.at(-1)).toMatchObject({ activeUsers: 1, sessions: 2 });
    expect(rows[0]).toMatchObject({ activeUsers: 0, sessions: 0 });
  });
});
