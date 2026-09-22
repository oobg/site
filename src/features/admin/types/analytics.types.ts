export interface AnalyticsDashboardData {
  range: { startDate: string; endDate: string; days: number };
  summary: {
    activeUsers: number;
    sessions: number;
    screenPageViews: number;
    engagementRate: number;
  };
  daily: Array<{
    date: string;
    activeUsers: number;
    sessions: number;
    screenPageViews: number;
    engagementRate: number;
  }>;
  channels: Array<{ name: string; sessions: number }>;
  pages: Array<{ path: string; title: string; views: number; activeUsers: number }>;
  devices: Array<{ name: string; activeUsers: number }>;
  locations: {
    countries: AnalyticsLocation[];
    regions: AnalyticsLocation[];
    cities: AnalyticsLocation[];
  };
  countries: Array<{ name: string; activeUsers: number; sessions: number }>;
  campaigns: Array<{
    source: string;
    medium: string;
    campaign: string;
    sessions: number;
    activeUsers: number;
  }>;
  browsers: Array<{ name: string; activeUsers: number; sessions: number }>;
  operatingSystems: Array<{ name: string; activeUsers: number; sessions: number }>;
  visitorTypes: Array<{ name: string; activeUsers: number; sessions: number }>;
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
