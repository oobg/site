'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { AnalyticsDashboardResult } from '@features/admin/types/analytics.types';
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

function shortDate(date: string) {
  return date.length === 8 ? `${Number(date.slice(4, 6))}/${Number(date.slice(6))}` : date;
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
  return (
    <section className={styles.dashboard} aria-label="방문 통계 데이터">
      <div className={styles.heading}>
        <div>
          <p>raven.kr · GA4</p>
        </div>
        <span>최근 {data.range.days}일</span>
      </div>
      <dl className={styles.metrics}>
        <div>
          <dt>활성 사용자</dt>
          <dd>{number.format(data.summary.activeUsers)}</dd>
        </div>
        <div>
          <dt>세션</dt>
          <dd>{number.format(data.summary.sessions)}</dd>
        </div>
        <div>
          <dt>조회수</dt>
          <dd>{number.format(data.summary.screenPageViews)}</dd>
        </div>
        <div>
          <dt>참여율</dt>
          <dd>{percent.format(data.summary.engagementRate)}</dd>
        </div>
      </dl>
      <div className={styles.grid}>
        <article className={`${styles.panel} ${styles.wide}`}>
          <h3>일별 추이</h3>
          <p>활성 사용자와 세션</p>
          <div className={styles.chart} aria-label="날짜별 활성 사용자와 세션 선 그래프">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={daily}
                margin={{ top: 12, right: 12, left: -18, bottom: 0 }}
                accessibilityLayer
              >
                <CartesianGrid stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="var(--color-text-muted)"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  stroke="var(--color-text-muted)"
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border-strong)',
                    borderRadius: 8,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="activeUsers"
                  name="활성 사용자"
                  stroke="var(--color-accent)"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="sessions"
                  name="세션"
                  stroke="var(--color-callout-important)"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                />
                <Legend />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>
        <article className={styles.panel}>
          <h3>유입 채널</h3>
          <p>채널별 세션</p>
          <div className={styles.chart} aria-label="유입 채널별 세션 막대 그래프">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.channels.map((x) => ({ ...x, label: channelNames[x.name] ?? x.name }))}
                layout="vertical"
                margin={{ top: 8, right: 10, left: 14, bottom: 0 }}
                accessibilityLayer
              >
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={78}
                  tickLine={false}
                  axisLine={false}
                  stroke="var(--color-text-secondary)"
                  fontSize={12}
                />
                <Tooltip
                  cursor={{ fill: 'var(--color-canvas-2)' }}
                  contentStyle={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border-strong)',
                    borderRadius: 8,
                  }}
                />
                <Bar
                  dataKey="sessions"
                  name="세션"
                  fill="var(--color-accent)"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
        <article className={styles.panel}>
          <h3>기기</h3>
          <p>기기별 활성 사용자</p>
          <ul className={styles.deviceList}>
            {data.devices.map((item) => (
              <li key={item.name}>
                <span>{deviceNames[item.name] ?? item.name}</span>
                <strong>{number.format(item.activeUsers)}</strong>
              </li>
            ))}
          </ul>
        </article>
        <article className={`${styles.panel} ${styles.wide}`}>
          <h3>인기 페이지</h3>
          <p>조회수 순</p>
          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>페이지</th>
                  <th>활성 사용자</th>
                  <th>조회수</th>
                </tr>
              </thead>
              <tbody>
                {data.pages.map((page) => (
                  <tr key={`${page.path}-${page.title}`}>
                    <td>
                      <strong>{page.title}</strong>
                      <span>{page.path}</span>
                    </td>
                    <td>{number.format(page.activeUsers)}</td>
                    <td>{number.format(page.views)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </section>
  );
}
