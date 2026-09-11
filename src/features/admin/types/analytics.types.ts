export interface AnalyticsDashboardData {
  range: { startDate: string; endDate: string; days: number };
  summary: {
    activeUsers: number;
    sessions: number;
    screenPageViews: number;
    engagementRate: number;
  };
  daily: Array<{ date: string; activeUsers: number; sessions: number }>;
  channels: Array<{ name: string; sessions: number }>;
  pages: Array<{ path: string; title: string; views: number; activeUsers: number }>;
  devices: Array<{ name: string; activeUsers: number }>;
  locations: {
    countries: AnalyticsLocation[];
    regions: AnalyticsLocation[];
    cities: AnalyticsLocation[];
  };
}

export interface AnalyticsLocation {
  name: string;
  activeUsers: number;
  sessions: number;
  views: number;
}

export type AnalyticsDashboardResult =
  | { status: 'ready'; data: AnalyticsDashboardData }
  | { status: 'not-configured'; missing: string[] }
  | { status: 'empty'; range: AnalyticsDashboardData['range'] }
  | { status: 'error'; message: string };
