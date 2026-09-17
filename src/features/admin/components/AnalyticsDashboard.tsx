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
import { Desktop, DeviceMobile, DeviceTablet, Pause, Play, Question } from '@phosphor-icons/react';
import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type {
  AnalyticsDashboardData,
  AnalyticsDashboardResult,
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

type DeviceInputMode = 'pointer' | 'keyboard';
type DevicePosition = 'front' | 'left' | 'right';

const deviceAngles: Record<DeviceKind, number> = {
  desktop: 0,
  tablet: -120,
  mobile: 120,
};
const activeAngles: Record<DeviceKind, number> = {
  desktop: 0,
  tablet: 120,
  mobile: -120,
};

function normalizeAngle(angle: number) {
  return ((((angle + 180) % 360) + 360) % 360) - 180;
}

function nearestEquivalentAngle(current: number, target: number) {
  return [target - 360, target, target + 360].reduce((nearest, candidate) =>
    Math.abs(candidate - current) < Math.abs(nearest - current) ? candidate : nearest,
  );
}

function getDevicePosition(kind: DeviceKind, activeDevice: DeviceKind): DevicePosition {
  const angle = normalizeAngle(deviceAngles[kind] + activeAngles[activeDevice]);
  if (Math.abs(angle) < 1) return 'front';
  return angle < 0 ? 'left' : 'right';
}

function DeviceGlyph({ kind }: { kind: DeviceKind }) {
  const Icon = deviceIcons[kind];
  return <Icon className={styles.deviceGlyph} aria-hidden weight="thin" />;
}

function DevicePerspective({ devices }: { devices: AnalyticsDashboardData['devices'] }) {
  const reduceMotion = useReducedMotion();
  const [selectedDevice, setSelectedDevice] = useState<DeviceKind>('desktop');
  const [hoveredDevice, setHoveredDevice] = useState<DeviceKind | null>(null);
  const [focusedDevice, setFocusedDevice] = useState<DeviceKind | null>(null);
  const [inputMode, setInputMode] = useState<DeviceInputMode>('pointer');
  const [previewSuppressed, setPreviewSuppressed] = useState(false);
  const [carouselPhase, setCarouselPhase] = useState(0);
  const inputModeRef = useRef<DeviceInputMode>('pointer');
  const knownDevices = deviceOrder.map((name) => ({
    name,
    activeUsers: devices.find((item) => item.name.toLowerCase() === name)?.activeUsers ?? 0,
  }));
  const otherDevices = devices.filter(
    (item) => !deviceOrder.includes(item.name.toLowerCase() as (typeof deviceOrder)[number]),
  );
  const items = [...knownDevices, ...otherDevices];
  const total = items.reduce((sum, item) => sum + item.activeUsers, 0);
  const activeDevice = previewSuppressed
    ? selectedDevice
    : inputMode === 'keyboard' && focusedDevice
      ? focusedDevice
      : inputMode === 'pointer' && hoveredDevice
        ? hoveredDevice
        : selectedDevice;

  useEffect(() => {
    const useKeyboard = (event: KeyboardEvent) => {
      if (!['Tab', 'ArrowDown', 'ArrowUp', 'Enter', ' ', 'Escape'].includes(event.key)) return;
      inputModeRef.current = 'keyboard';
      setInputMode('keyboard');
    };
    document.addEventListener('keydown', useKeyboard, true);
    return () => document.removeEventListener('keydown', useKeyboard, true);
  }, []);

  const rotateToDevice = (kind: DeviceKind) => {
    setCarouselPhase((current) => nearestEquivalentAngle(current, activeAngles[kind]));
  };

  const activatePointerMode = () => {
    inputModeRef.current = 'pointer';
    setInputMode('pointer');
    setPreviewSuppressed(false);
  };

  const transition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.32, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] };

  return (
    <div className={styles.devicePerspective}>
      <div
        className={styles.deviceStage}
        data-active-device={activeDevice}
        data-testid="device-stage"
        aria-hidden="true"
      >
        <div className={styles.deviceStageSummary}>
          <span>전체 활성 사용자</span>
          <strong>{formatCompact(total)}</strong>
        </div>
        <motion.div
          className={styles.deviceCarousel}
          animate={{ rotateX: -6, rotateY: carouselPhase }}
          transition={transition}
        >
          {knownDevices.map((item) => {
            const kind = item.name as DeviceKind;
            const position = getDevicePosition(kind, activeDevice);
            const facingAngle = -normalizeAngle(deviceAngles[kind] + activeAngles[activeDevice]);
            return (
              <div
                className={styles.deviceUnit}
                data-device={kind}
                data-position={position}
                key={item.name}
                style={{
                  transform: `rotateY(${deviceAngles[kind]}deg) translateZ(var(--device-radius, 136px))`,
                }}
              >
                <motion.div
                  className={styles.deviceFace}
                  animate={{ rotateX: 6, rotateY: facingAngle }}
                  transition={transition}
                >
                  <DeviceGlyph kind={kind} />
                </motion.div>
              </div>
            );
          })}
        </motion.div>
      </div>
      <ul
        className={styles.deviceLegend}
        aria-label="디바이스 유형별 활성 사용자"
        onBlur={(event) => {
          if (event.currentTarget.contains(event.relatedTarget)) return;
          setFocusedDevice(null);
          setPreviewSuppressed(false);
          rotateToDevice(selectedDevice);
        }}
        onPointerLeave={() => {
          setHoveredDevice(null);
          setPreviewSuppressed(false);
          rotateToDevice(selectedDevice);
        }}
      >
        {items.map((item) => {
          const deviceKey = item.name.toLowerCase();
          const isKnownDevice = deviceOrder.includes(deviceKey as DeviceKind);
          const kind = isKnownDevice ? (deviceKey as DeviceKind) : null;
          const DeviceIcon = kind ? deviceIcons[kind] : Question;
          const label = deviceNames[deviceKey] ?? item.name;
          const content = (
            <>
              <div className={styles.deviceLegendLabel}>
                <span className={styles.deviceIcon} data-device={deviceKey}>
                  <DeviceIcon aria-hidden size={17} weight="regular" />
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
            </>
          );
          return (
            <li key={item.name}>
              {kind ? (
                <button
                  type="button"
                  className={styles.deviceButton}
                  aria-label={`${label} ${number.format(item.activeUsers)}명 ${ratio(item.activeUsers, total)}%`}
                  aria-pressed={selectedDevice === kind}
                  data-previewed={activeDevice === kind && selectedDevice !== kind ? '' : undefined}
                  onClick={() => {
                    setSelectedDevice(kind);
                    setPreviewSuppressed(false);
                    rotateToDevice(kind);
                  }}
                  onFocus={() => {
                    if (inputModeRef.current === 'keyboard') {
                      setFocusedDevice(kind);
                      setPreviewSuppressed(false);
                      rotateToDevice(kind);
                    }
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                      event.preventDefault();
                      setPreviewSuppressed(true);
                      rotateToDevice(selectedDevice);
                      return;
                    }
                    setFocusedDevice(kind);
                    setPreviewSuppressed(false);
                    rotateToDevice(kind);
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedDevice(kind);
                    }
                  }}
                  onPointerDown={activatePointerMode}
                  onPointerEnter={(event) => {
                    if (event.pointerType === 'touch') return;
                    activatePointerMode();
                    setHoveredDevice(kind);
                    rotateToDevice(kind);
                  }}
                  onPointerMove={(event) => {
                    if (event.pointerType === 'touch') return;
                    activatePointerMode();
                    setHoveredDevice(kind);
                    rotateToDevice(kind);
                  }}
                >
                  {content}
                </button>
              ) : (
                <div className={styles.deviceStatic}>{content}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function CountryGlobe({ countries }: { countries: AnalyticsDashboardData['countries'] }) {
  const reduceMotion = useReducedMotion();
  const [rotationPaused, setRotationPaused] = useState(false);
  const max = Math.max(...countries.map((country) => country.activeUsers), 0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotationEnabledRef = useRef(true);
  const syncRotationRef = useRef<() => void>(() => undefined);
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
    rotationEnabledRef.current = !rotationPaused && !reduceMotion;
    syncRotationRef.current();
  }, [reduceMotion, rotationPaused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let phi = 0;
    let frame = 0;
    let lastTime = 0;
    let isIntersecting = true;
    let isPageVisible = document.visibilityState === 'visible';
    let globe: ReturnType<typeof createGlobe> | undefined;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const renderSize = Math.max(360, Math.round(canvas.clientWidth * pixelRatio));

    const stopRotation = () => {
      if (!frame) return;
      cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
    };

    const animate = (time: number) => {
      if (lastTime) {
        const delta = Math.min((time - lastTime) / 1000, 0.1);
        phi += delta * 0.03;
        globe?.update({ phi });
      }
      lastTime = time;
      frame = requestAnimationFrame(animate);
    };

    const syncRotation = () => {
      if (rotationEnabledRef.current && isIntersecting && isPageVisible) {
        if (!frame) frame = requestAnimationFrame(animate);
        return;
      }
      stopRotation();
    };

    syncRotationRef.current = syncRotation;

    try {
      globe = createGlobe(canvas, {
        devicePixelRatio: pixelRatio,
        width: renderSize,
        height: renderSize,
        phi,
        theta: 0.14,
        dark: 0,
        diffuse: 1.05,
        scale: 0.96,
        mapSamples: 16000,
        mapBrightness: 1.25,
        mapBaseBrightness: 0.08,
        baseColor: [0.96, 0.97, 0.99],
        markerColor: [0.24, 0.49, 0.9],
        glowColor: [0.98, 0.99, 1],
        markers,
      });
      syncRotation();
    } catch (error) {
      console.warn('Cobe globe could not be initialized.', error);
    }

    const handleVisibility = () => {
      isPageVisible = document.visibilityState === 'visible';
      syncRotation();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const intersectionObserver =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver(([entry]) => {
            isIntersecting = entry?.isIntersecting ?? true;
            syncRotation();
          });
    intersectionObserver?.observe(canvas);

    const resizeObserver =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(([entry]) => {
            const width = entry?.contentRect.width ?? canvas.clientWidth;
            const size = Math.max(360, Math.round(width * pixelRatio));
            globe?.update({ width: size, height: size });
          });
    resizeObserver?.observe(canvas);

    return () => {
      syncRotationRef.current = () => undefined;
      stopRotation();
      document.removeEventListener('visibilitychange', handleVisibility);
      intersectionObserver?.disconnect();
      resizeObserver?.disconnect();
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
        <button
          type="button"
          className={styles.globeControl}
          aria-pressed={rotationPaused}
          disabled={Boolean(reduceMotion)}
          onClick={() => setRotationPaused((paused) => !paused)}
        >
          {rotationPaused || reduceMotion ? (
            <Play aria-hidden size={14} weight="bold" />
          ) : (
            <Pause aria-hidden size={14} weight="bold" />
          )}
          {reduceMotion ? '동작 줄이기 사용 중' : rotationPaused ? '회전 시작' : '회전 멈춤'}
        </button>
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

function PagesList({ pages }: { pages: AnalyticsDashboardData['pages'] }) {
  if (!pages.length) return <p className={styles.emptyHint}>페이지 데이터가 아직 없어요.</p>;
  return (
    <ul className={styles.pageList}>
      {pages.slice(0, 8).map((page) => (
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
          <span className={styles.liveMark}>GA4 · 15분 갱신</span>
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
          <CountryGlobe countries={data.countries} />
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
