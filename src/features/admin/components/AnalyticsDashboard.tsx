'use client';

import createGlobe from 'cobe';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Desktop, DeviceMobile, DeviceTablet, Question } from '@phosphor-icons/react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type {
  AnalyticsDashboardData,
  AnalyticsDashboardResult,
  AnalyticsLocation,
} from '@features/admin/types/analytics.types';
import { formatCountryName, getCountryGeo } from './analytics-geo';
import styles from './AnalyticsDashboard.module.css';

const number = new Intl.NumberFormat('ko-KR');
const percent = new Intl.NumberFormat('ko-KR', { style: 'percent', maximumFractionDigits: 1 });
const channelNames: Record<string, string> = {
  Direct: '직접 방문',
  'Organic Search': '자연 검색',
  Referral: '추천',
  'Organic Social': '자연 소셜',
  'Paid Search': '유료 검색',
  Email: '이메일',
  Unassigned: '미분류',
};
const deviceNames: Record<string, string> = {
  desktop: '데스크톱',
  mobile: '모바일',
  tablet: '태블릿',
  unknown: '기타',
};
const visitorNames: Record<string, string> = {
  new: '신규 방문',
  returning: '재방문',
  '(not set)': '분류되지 않음',
};
const deviceIcons = {
  desktop: Desktop,
  mobile: DeviceMobile,
  tablet: DeviceTablet,
};
const deviceOrder = ['desktop', 'mobile', 'tablet'] as const;
const chartTooltipStyle = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border-strong)',
  borderRadius: 8,
  boxShadow: 'var(--d0-shadow-card)',
};

type DailyKey = 'activeUsers' | 'sessions' | 'screenPageViews' | 'engagementRate';

function shortDate(date: string) {
  return date.length === 8 ? `${Number(date.slice(4, 6))}/${Number(date.slice(6))}` : date;
}

function formatCompact(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2).replace(/\.00$/, '')}m`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(2).replace(/\.00$/, '')}k`;
  return number.format(value);
}

function ratio(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

function isAdminAnalyticsPath(path: string) {
  return path === '/admin' || path.startsWith('/admin/');
}

function MetricSparkline({
  data,
  dataKey,
}: {
  data: AnalyticsDashboardData['daily'];
  dataKey: DailyKey;
}) {
  return (
    <div className={styles.sparkline} aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke="var(--metric-color)"
            strokeWidth={1.8}
            dot={false}
            activeDot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function PanelHeader({ title, description }: { title: string; description?: string }) {
  return (
    <header className={styles.panelHeader}>
      <div>
        <h3>{title}</h3>
        {description ? <p>{description}</p> : null}
      </div>
      <span className={styles.panelMenu} aria-hidden="true">
        ···
      </span>
    </header>
  );
}

function MetricBarList({
  items,
  emptyLabel = '데이터가 없어요.',
}: {
  items: Array<{ label: string; value: number; meta?: ReactNode }>;
  emptyLabel?: string;
}) {
  const max = Math.max(...items.map((item) => item.value), 0);
  if (!items.length) return <p className={styles.emptyHint}>{emptyLabel}</p>;
  return (
    <ul className={styles.metricBarList}>
      {items.map((item, index) => (
        <li key={`${item.label}-${index}`}>
          <div className={styles.metricBarLabel}>
            <span>
              <small>{String(index + 1).padStart(2, '0')}</small>
              {item.label}
            </span>
            <strong>{formatCompact(item.value)}</strong>
          </div>
          <div className={styles.metricBarTrack} aria-hidden="true">
            <span style={{ width: `${max > 0 ? (item.value / max) * 100 : 0}%` }} />
          </div>
          {item.meta ? <span className={styles.metricBarMeta}>{item.meta}</span> : null}
        </li>
      ))}
    </ul>
  );
}

type DeviceKind = (typeof deviceOrder)[number];

function DeviceGlyph({ kind }: { kind: DeviceKind }) {
  if (kind === 'desktop') {
    return (
      <svg className={styles.deviceGlyph} viewBox="0 0 240 160" aria-hidden="true">
        <rect className={styles.deviceShell} x="18" y="12" width="204" height="112" rx="10" />
        <rect className={styles.deviceScreen} x="30" y="24" width="180" height="88" rx="5" />
        <path className={styles.deviceDetail} d="M94 137h52M80 148h80" />
      </svg>
    );
  }

  if (kind === 'tablet') {
    return (
      <svg className={styles.deviceGlyph} viewBox="0 0 240 160" aria-hidden="true">
        <rect className={styles.deviceShell} x="43" y="8" width="154" height="144" rx="18" />
        <rect className={styles.deviceScreen} x="53" y="20" width="134" height="112" rx="11" />
        <circle className={styles.deviceDetailFill} cx="120" cy="142" r="3" />
      </svg>
    );
  }

  return (
    <svg className={styles.deviceGlyph} viewBox="0 0 240 160" aria-hidden="true">
      <rect className={styles.deviceShell} x="78" y="7" width="84" height="146" rx="20" />
      <rect className={styles.deviceScreen} x="87" y="23" width="66" height="111" rx="10" />
      <path className={styles.deviceDetail} d="M111 15h18" />
      <circle className={styles.deviceDetailFill} cx="120" cy="143" r="3" />
    </svg>
  );
}

function DevicePerspective({ devices }: { devices: AnalyticsDashboardData['devices'] }) {
  const [activeDevice, setActiveDevice] = useState<string>('desktop');
  const knownDevices = deviceOrder.map((name) => ({
    name,
    activeUsers: devices.find((item) => item.name.toLowerCase() === name)?.activeUsers ?? 0,
  }));
  const otherDevices = devices.filter(
    (item) => !deviceOrder.includes(item.name.toLowerCase() as (typeof deviceOrder)[number]),
  );
  const items = [...knownDevices, ...otherDevices];
  const total = items.reduce((sum, item) => sum + item.activeUsers, 0);
  const deviceClasses: Record<DeviceKind, string> = {
    desktop: styles.deviceDesktop,
    tablet: styles.deviceTablet,
    mobile: styles.deviceMobile,
  };

  return (
    <div className={styles.devicePerspective}>
      <div className={styles.deviceStage} data-active-device={activeDevice} aria-hidden="true">
        <div className={styles.deviceStageSummary}>
          <span>전체 활성 사용자</span>
          <strong>{formatCompact(total)}</strong>
        </div>
        {knownDevices.map((item, index) => {
          const kind = item.name as DeviceKind;
          return (
            <div
              className={`${styles.deviceUnit} ${deviceClasses[kind]}`}
              data-active={activeDevice === kind}
              data-depth={index}
              data-device={kind}
              key={item.name}
            >
              <DeviceGlyph kind={kind} />
            </div>
          );
        })}
      </div>
      <ul className={styles.deviceLegend} aria-label="디바이스 유형별 활성 사용자">
        {items.map((item) => {
          const DeviceIcon =
            deviceIcons[item.name.toLowerCase() as keyof typeof deviceIcons] ?? Question;
          const label = deviceNames[item.name.toLowerCase()] ?? item.name;
          const deviceKey = item.name.toLowerCase();
          return (
            <li key={item.name}>
              <button
                type="button"
                className={styles.deviceButton}
                aria-pressed={activeDevice === deviceKey}
                onClick={() => setActiveDevice(deviceKey)}
                onFocus={() => setActiveDevice(deviceKey)}
                onMouseEnter={() => setActiveDevice(deviceKey)}
              >
                <div className={styles.deviceLegendLabel}>
                  <span className={styles.deviceIcon} data-device={deviceKey}>
                    <DeviceIcon aria-hidden size={17} weight="bold" />
                  </span>
                  <span>{label}</span>
                </div>
                <div className={styles.deviceLegendValue}>
                  <strong>{formatCompact(item.activeUsers)}</strong>
                  <span>{ratio(item.activeUsers, total)}%</span>
                </div>
                <div className={styles.deviceLegendBar} aria-hidden="true">
                  <span style={{ width: `${ratio(item.activeUsers, total)}%` }} />
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function CountryGlobe({ countries }: { countries: AnalyticsDashboardData['countries'] }) {
  const max = Math.max(...countries.map((country) => country.activeUsers), 0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const markers = useMemo(
    () =>
      countries.flatMap((country) => {
        const geo = getCountryGeo(country.name);
        if (!geo) return [];
        return [
          {
            location: [geo.latitude, geo.longitude] as [number, number],
            size: Math.min(0.1, 0.025 + (max > 0 ? (country.activeUsers / max) * 0.055 : 0)),
          },
        ];
      }),
    [countries, max],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let phi = 0;
    let frame = 0;
    let globe: ReturnType<typeof createGlobe> | undefined;
    try {
      globe = createGlobe(canvas, {
        devicePixelRatio: 2,
        width: 720,
        height: 720,
        phi,
        theta: 0.16,
        dark: 0,
        diffuse: 1.2,
        scale: 1,
        mapSamples: 16000,
        mapBrightness: 2.1,
        mapBaseBrightness: 0.16,
        baseColor: [0.72, 0.78, 0.86],
        markerColor: [0.95, 0.48, 0.16],
        glowColor: [0.94, 0.96, 0.98],
        markers,
      });
      const reducedMotion =
        typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!reducedMotion) {
        const animate = () => {
          phi += 0.0025;
          globe?.update({ phi });
          frame = requestAnimationFrame(animate);
        };
        frame = requestAnimationFrame(animate);
      }
    } catch (error) {
      console.warn('Cobe globe could not be initialized.', error);
    }

    return () => {
      cancelAnimationFrame(frame);
      globe?.destroy();
    };
  }, [markers]);

  return (
    <div className={styles.countryLayout}>
      <div className={styles.globeWrap}>
        <canvas
          ref={canvasRef}
          className={styles.globe}
          width="720"
          height="720"
          role="img"
          aria-label="국가별 활성 사용자를 표시한 지구본"
        />
        <span className={styles.globeCaption}>상위 국가 위치</span>
      </div>
      <MetricBarList
        items={countries.slice(0, 8).map((country) => ({
          label: formatCountryName(country.name),
          value: country.activeUsers,
          meta: `${formatCompact(country.sessions)} 세션`,
        }))}
        emptyLabel="국가별 데이터가 아직 없어요."
      />
    </div>
  );
}

function CampaignList({ campaigns }: { campaigns: AnalyticsDashboardData['campaigns'] }) {
  if (!campaigns.length) return <p className={styles.emptyHint}>UTM 유입 데이터가 아직 없어요.</p>;
  return (
    <ul className={styles.campaignList}>
      {campaigns.map((item, index) => {
        const source = item.source === '(not set)' ? '직접 방문' : item.source;
        const medium = item.medium === '(not set)' ? 'none' : item.medium;
        const campaign = item.campaign === '(not set)' ? '캠페인 미지정' : item.campaign;
        return (
          <li key={`${item.source}-${item.medium}-${item.campaign}-${index}`}>
            <div className={styles.campaignTopline}>
              <span className={styles.campaignSource}>
                {source} <i>/</i> {medium}
              </span>
              <strong>{formatCompact(item.sessions)}</strong>
            </div>
            <div className={styles.campaignMeta}>
              <code>utm_campaign</code>
              <span>{campaign}</span>
              <small>{formatCompact(item.activeUsers)} 사용자</small>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function TechSummary({
  browsers,
  operatingSystems,
}: {
  browsers: AnalyticsDashboardData['browsers'];
  operatingSystems: AnalyticsDashboardData['operatingSystems'];
}) {
  return (
    <div className={styles.techColumns}>
      <div>
        <h4>브라우저</h4>
        <MetricBarList
          items={browsers.slice(0, 5).map((item) => ({
            label: item.name,
            value: item.activeUsers,
          }))}
        />
      </div>
      <div>
        <h4>운영체제</h4>
        <MetricBarList
          items={operatingSystems.slice(0, 5).map((item) => ({
            label: item.name,
            value: item.activeUsers,
          }))}
        />
      </div>
    </div>
  );
}

function LocationMetricList({ title, items }: { title: string; items: AnalyticsLocation[] }) {
  return (
    <div className={styles.locationDetailList}>
      <h4>{title}</h4>
      <MetricBarList
        items={items.slice(0, 8).map((item) => ({
          label: item.name,
          value: item.activeUsers,
          meta: `${formatCompact(item.sessions)} 세션 · ${formatCompact(item.views)}회`,
        }))}
        emptyLabel={`${title} 데이터가 아직 없어요.`}
      />
    </div>
  );
}

function PagesList({ pages }: { pages: AnalyticsDashboardData['pages'] }) {
  const publicPages = pages.filter((page) => !isAdminAnalyticsPath(page.path));
  if (!publicPages.length) return <p className={styles.emptyHint}>페이지 데이터가 아직 없어요.</p>;
  return (
    <ul className={styles.pageList}>
      {publicPages.slice(0, 8).map((page) => (
        <li key={`${page.path}-${page.title}`}>
          <div>
            <strong>{page.title}</strong>
            <span>{page.path}</span>
          </div>
          <strong>{formatCompact(page.views)}</strong>
        </li>
      ))}
    </ul>
  );
}

export function AnalyticsDashboard({ result }: { result: AnalyticsDashboardResult }) {
  if (result.status === 'not-configured')
    return (
      <section className={styles.state} aria-labelledby="analytics-title">
        <h2 id="analytics-title">방문 통계</h2>
        <p>GA4 Data API 설정이 필요해요.</p>
        <p className={styles.detail}>서버에 {result.missing.join(', ')} 값을 추가해 주세요.</p>
      </section>
    );
  if (result.status === 'error')
    return (
      <section className={styles.state} aria-labelledby="analytics-title" role="status">
        <h2 id="analytics-title">방문 통계</h2>
        <p>{result.message}</p>
        <p className={styles.detail}>페이지를 새로고침해 다시 요청할 수 있어요.</p>
      </section>
    );
  if (result.status === 'empty')
    return (
      <section className={styles.state} aria-labelledby="analytics-title">
        <h2 id="analytics-title">방문 통계</h2>
        <p>아직 집계된 방문 통계가 없어요.</p>
        <p className={styles.detail}>
          최근 {result.range.days}일 기준이며, 새 방문이 보고서에 반영되기까지 시간이 걸릴 수
          있어요.
        </p>
      </section>
    );

  const { data } = result;
  const daily = data.daily.map((item) => ({ ...item, label: shortDate(item.date) }));
  const metricCards = [
    {
      label: '활성 사용자',
      value: formatCompact(data.summary.activeUsers),
      dataKey: 'activeUsers' as const,
      tone: 'blue',
    },
    {
      label: '세션',
      value: formatCompact(data.summary.sessions),
      dataKey: 'sessions' as const,
      tone: 'green',
    },
    {
      label: '조회수',
      value: formatCompact(data.summary.screenPageViews),
      dataKey: 'screenPageViews' as const,
      tone: 'orange',
    },
    {
      label: '참여율',
      value: percent.format(data.summary.engagementRate),
      dataKey: 'engagementRate' as const,
      tone: 'violet',
    },
  ];

  return (
    <section className={styles.dashboard} aria-label="방문 통계 데이터">
      <div className={styles.heading}>
        <div>
          <p className={styles.kicker}>RAVEN.KR / GA4</p>
          <strong>방문 흐름을 한눈에</strong>
        </div>
        <div className={styles.headingMeta}>
          <span className={styles.liveMark}>GA4 · 1시간 갱신</span>
          <span>최근 {data.range.days}일</span>
        </div>
      </div>

      <dl className={styles.metrics}>
        {metricCards.map((metric) => (
          <div className={styles.metricCard} data-tone={metric.tone} key={metric.label}>
            <dt>{metric.label}</dt>
            <dd>{metric.value}</dd>
            <span className={styles.metricRange}>최근 {data.range.days}일</span>
            <MetricSparkline data={data.daily} dataKey={metric.dataKey} />
          </div>
        ))}
      </dl>

      <div className={styles.grid}>
        <article className={`${styles.panel} ${styles.timelinePanel}`}>
          <PanelHeader title="시간 경과에 따른 방문" description="활성 사용자와 세션" />
          <div className={styles.timelineChart} aria-label="날짜별 활성 사용자와 세션 선 그래프">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={daily}
                margin={{ top: 16, right: 12, left: -18, bottom: 0 }}
                accessibilityLayer
              >
                <CartesianGrid stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="var(--color-text-muted)"
                  tickLine={false}
                  axisLine={false}
                  minTickGap={22}
                />
                <YAxis
                  allowDecimals={false}
                  stroke="var(--color-text-muted)"
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="sessions"
                  name="세션"
                  stroke="var(--d0-blue)"
                  fill="var(--d0-blue-light)"
                  fillOpacity={0.7}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="activeUsers"
                  name="활성 사용자"
                  stroke="var(--d0-grey-800)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className={styles.chartLegend} aria-hidden="true">
            <span>
              <i data-color="blue" /> 세션 {formatCompact(data.summary.sessions)}
            </span>
            <span>
              <i data-color="ink" /> 활성 사용자 {formatCompact(data.summary.activeUsers)}
            </span>
          </div>
        </article>

        <article className={`${styles.panel} ${styles.devicePanel}`}>
          <PanelHeader title="디바이스 유형별 방문" description="활성 사용자 기준" />
          <DevicePerspective devices={data.devices} />
        </article>

        <article className={`${styles.panel} ${styles.countryPanel}`}>
          <PanelHeader title="국가별 방문" description="상위 국가와 위치" />
          <CountryGlobe countries={data.locations.countries} />
        </article>

        <article className={`${styles.panel} ${styles.locationDetailPanel}`}>
          <PanelHeader
            title="세부 접속 위치"
            description="지역·도시별 활성 사용자 · 최대 1시간 지연"
          />
          <div className={styles.locationDetailGrid}>
            <LocationMetricList title="지역" items={data.locations.regions} />
            <LocationMetricList title="도시" items={data.locations.cities} />
          </div>
        </article>

        <article className={`${styles.panel} ${styles.channelPanel}`}>
          <PanelHeader title="유입 채널" description="세션 기준" />
          <MetricBarList
            items={data.channels.map((item) => ({
              label: channelNames[item.name] ?? item.name,
              value: item.sessions,
            }))}
          />
        </article>

        <article className={`${styles.panel} ${styles.audiencePanel}`}>
          <PanelHeader title="신규와 재방문" description="활성 사용자 기준" />
          <MetricBarList
            items={data.visitorTypes.map((item) => ({
              label: visitorNames[item.name] ?? item.name,
              value: item.activeUsers,
              meta: `${formatCompact(item.sessions)} 세션`,
            }))}
            emptyLabel="방문 유형 데이터가 아직 없어요."
          />
        </article>

        <article className={`${styles.panel} ${styles.techPanel}`}>
          <PanelHeader title="브라우저와 운영체제" description="활성 사용자 기준" />
          <TechSummary browsers={data.browsers} operatingSystems={data.operatingSystems} />
        </article>

        <article className={`${styles.panel} ${styles.acquisitionPanel}`}>
          <PanelHeader title="UTM 캠페인" description="수동 소스·매체·캠페인 기준" />
          <CampaignList campaigns={data.campaigns} />
        </article>

        <article className={`${styles.panel} ${styles.pagesPanel}`}>
          <PanelHeader title="인기 페이지" description="조회수 순" />
          <PagesList pages={data.pages} />
        </article>
      </div>
    </section>
  );
}
