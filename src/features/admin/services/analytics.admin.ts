import 'server-only';

import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { unstable_cache } from 'next/cache';
import { requireOwner } from '@lib/auth/owner';
import type {
  AnalyticsDashboardData,
  AnalyticsLocation,
  AnalyticsDashboardResult,
} from '@features/admin/types/analytics.types';

const RANGE_DAYS = 28;

function value(input: string | null | undefined) {
  const parsed = Number(input ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function range() {
  return {
    startDate: '27daysAgo',
    endDate: 'today',
    days: RANGE_DAYS,
  };
}

type AnalyticsRow = {
  dimensionValues?: Array<{ value?: string | null }> | null;
  metricValues?: Array<{ value?: string | null }> | null;
};

type AnalyticsReport = { rows?: AnalyticsRow[] | null };

function locationValue(value: string | undefined, fallback = '알 수 없음') {
  const normalized = value?.trim();
  return !normalized || normalized === '(not set)' ? fallback : normalized;
}

function optionalLocationValue(value: string | undefined) {
  const normalized = value?.trim();
  return !normalized || normalized === '(not set)' ? '' : normalized;
}

function mapLocationRows(
  report: AnalyticsReport | undefined,
  getName: (dimensions: string[]) => string,
): AnalyticsLocation[] {
  return (report?.rows ?? [])
    .map((row) => {
      const dimensions = (row.dimensionValues ?? []).map((item) => item.value?.trim() ?? '');
      if (!dimensions.some(Boolean)) return null;
      const name = getName(dimensions).trim();
      if (!name) return null;
      return {
        name,
        activeUsers: value(row.metricValues?.[0]?.value),
        sessions: value(row.metricValues?.[1]?.value),
        views: value(row.metricValues?.[2]?.value),
      };
    })
    .filter((item): item is AnalyticsLocation => item !== null);
}

export function isAdminAnalyticsPath(path: string) {
  return path === '/admin' || path.startsWith('/admin/');
}

export function fillDailyRange(
  rows: AnalyticsDashboardData['daily'],
  timeZone: string,
  days = RANGE_DAYS,
) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((item) => item.type === type)?.value);
  const end = new Date(Date.UTC(part('year'), part('month') - 1, part('day')));
  const byDate = new Map(rows.map((row) => [row.date, row]));
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(end);
    date.setUTCDate(end.getUTCDate() - (days - 1 - index));
    const key = date.toISOString().slice(0, 10).replaceAll('-', '');
    return byDate.get(key) ?? { date: key, activeUsers: 0, sessions: 0 };
  });
}

const fetchAnalyticsDashboard = unstable_cache(
  async (): Promise<AnalyticsDashboardResult> => {
    const propertyId = process.env.GA4_PROPERTY_ID?.trim();
    const clientEmail = process.env.GA4_CLIENT_EMAIL?.trim();
    const privateKey = process.env.GA4_PRIVATE_KEY?.replace(/\\n/g, '\n').trim();
    const applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
    const missing = [
      (!propertyId || !/^\d+$/.test(propertyId)) && 'GA4_PROPERTY_ID (숫자)',
      !applicationCredentials &&
        !clientEmail &&
        'GA4_CLIENT_EMAIL 또는 GOOGLE_APPLICATION_CREDENTIALS',
      !applicationCredentials &&
        !privateKey &&
        'GA4_PRIVATE_KEY 또는 GOOGLE_APPLICATION_CREDENTIALS',
    ].filter((item): item is string => Boolean(item));
    if (missing.length) return { status: 'not-configured', missing };

    const dateRange = range();
    const property = `properties/${propertyId}`;
    const hostname = process.env.GA4_HOSTNAME?.trim() || 'raven.kr';
    const dimensionFilter = {
      filter: {
        fieldName: 'hostName',
        stringFilter: { matchType: 'EXACT' as const, value: hostname },
      },
    };
    const publicPageDimensionFilter = {
      andGroup: {
        expressions: [
          dimensionFilter,
          {
            notExpression: {
              orGroup: {
                expressions: [
                  {
                    filter: {
                      fieldName: 'pagePath',
                      stringFilter: { matchType: 'EXACT' as const, value: '/admin' },
                    },
                  },
                  {
                    filter: {
                      fieldName: 'pagePath',
                      stringFilter: { matchType: 'BEGINS_WITH' as const, value: '/admin/' },
                    },
                  },
                ],
              },
            },
          },
        ],
      },
    };

    try {
      const client = new BetaAnalyticsDataClient(
        applicationCredentials
          ? {}
          : { credentials: { client_email: clientEmail, private_key: privateKey } },
      );
      const [response] = await client.batchRunReports(
        {
          property,
          requests: [
            {
              dateRanges: [dateRange],
              metrics: ['activeUsers', 'sessions', 'screenPageViews', 'engagementRate'].map(
                (name) => ({ name }),
              ),
              dimensionFilter,
            },
            {
              dateRanges: [dateRange],
              dimensions: [{ name: 'date' }],
              metrics: ['activeUsers', 'sessions'].map((name) => ({ name })),
              dimensionFilter,
              orderBys: [{ dimension: { dimensionName: 'date' } }],
            },
            {
              dateRanges: [dateRange],
              dimensions: [{ name: 'sessionDefaultChannelGroup' }],
              metrics: [{ name: 'sessions' }],
              dimensionFilter,
              orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
              limit: 8,
            },
            {
              dateRanges: [dateRange],
              dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
              metrics: ['screenPageViews', 'activeUsers'].map((name) => ({ name })),
              dimensionFilter: publicPageDimensionFilter,
              orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
              limit: 20,
            },
            {
              dateRanges: [dateRange],
              dimensions: [{ name: 'deviceCategory' }],
              metrics: [{ name: 'activeUsers' }],
              dimensionFilter,
              orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
            },
          ],
        },
        { timeout: 10_000 },
      );
      const reports = response.reports ?? [];
      const summaryRow = reports[0]?.rows?.[0];
      if (!summaryRow || summaryRow.metricValues?.every((metric) => value(metric.value) === 0))
        return { status: 'empty', range: dateRange };

      let locationReports: typeof reports = [];
      try {
        const [locationResponse] = await client.batchRunReports(
          {
            property,
            requests: [
              {
                dateRanges: [dateRange],
                dimensions: [{ name: 'country' }],
                metrics: ['activeUsers', 'sessions', 'screenPageViews'].map((name) => ({ name })),
                dimensionFilter,
                orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
                limit: 8,
              },
              {
                dateRanges: [dateRange],
                dimensions: [{ name: 'country' }, { name: 'region' }],
                metrics: ['activeUsers', 'sessions', 'screenPageViews'].map((name) => ({ name })),
                dimensionFilter,
                orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
                limit: 8,
              },
              {
                dateRanges: [dateRange],
                dimensions: [{ name: 'country' }, { name: 'region' }, { name: 'city' }],
                metrics: ['activeUsers', 'sessions', 'screenPageViews'].map((name) => ({ name })),
                dimensionFilter,
                orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
                limit: 8,
              },
            ],
          },
          { timeout: 10_000 },
        );
        locationReports = locationResponse.reports ?? [];
      } catch (error) {
        const code =
          typeof error === 'object' && error && 'code' in error ? String(error.code) : 'unknown';
        console.warn(`GA4 location reports unavailable (code: ${code})`);
      }

      const data: AnalyticsDashboardData = {
        range: dateRange,
        summary: {
          activeUsers: value(summaryRow.metricValues?.[0]?.value),
          sessions: value(summaryRow.metricValues?.[1]?.value),
          screenPageViews: value(summaryRow.metricValues?.[2]?.value),
          engagementRate: value(summaryRow.metricValues?.[3]?.value),
        },
        daily: fillDailyRange(
          (reports[1]?.rows ?? []).map((row) => ({
            date: row.dimensionValues?.[0]?.value ?? '',
            activeUsers: value(row.metricValues?.[0]?.value),
            sessions: value(row.metricValues?.[1]?.value),
          })),
          reports[1]?.metadata?.timeZone || 'Asia/Seoul',
        ),
        channels: (reports[2]?.rows ?? []).map((row) => ({
          name: row.dimensionValues?.[0]?.value || 'Unassigned',
          sessions: value(row.metricValues?.[0]?.value),
        })),
        pages: (reports[3]?.rows ?? [])
          .map((row) => ({
            path: row.dimensionValues?.[0]?.value || '/',
            title: row.dimensionValues?.[1]?.value || '제목 없음',
            views: value(row.metricValues?.[0]?.value),
            activeUsers: value(row.metricValues?.[1]?.value),
          }))
          .filter((page) => !isAdminAnalyticsPath(page.path))
          .slice(0, 10),
        devices: (reports[4]?.rows ?? []).map((row) => ({
          name: row.dimensionValues?.[0]?.value || 'unknown',
          activeUsers: value(row.metricValues?.[0]?.value),
        })),
        locations: {
          countries: mapLocationRows(locationReports[0], ([country]) => locationValue(country)),
          regions: mapLocationRows(locationReports[1], ([country, region]) => {
            const regionName = optionalLocationValue(region);
            return regionName
              ? `${regionName} · ${locationValue(country)}`
              : locationValue(country);
          }),
          cities: mapLocationRows(locationReports[2], ([country, region, city]) => {
            return [
              optionalLocationValue(city),
              optionalLocationValue(region),
              locationValue(country),
            ]
              .filter(Boolean)
              .join(' · ');
          }),
        },
      };
      return { status: 'ready', data };
    } catch (error) {
      const code =
        typeof error === 'object' && error && 'code' in error ? String(error.code) : 'unknown';
      console.error(`GA4 Data API request failed (code: ${code})`);
      return { status: 'error', message: '방문 통계를 불러오지 못했어요.' };
    }
  },
  ['admin-ga4-dashboard-v2'],
  { revalidate: 3600 },
);

export async function getAnalyticsDashboard(): Promise<AnalyticsDashboardResult> {
  await requireOwner();
  return fetchAnalyticsDashboard();
}
