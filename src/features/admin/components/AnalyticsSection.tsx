import { AnalyticsDashboard } from '@features/admin/components/AnalyticsDashboard';
import { getAnalyticsDashboard } from '@features/admin/services/analytics.admin';
import styles from './AnalyticsDashboard.module.css';

export async function AnalyticsSection() {
  return <AnalyticsDashboard result={await getAnalyticsDashboard()} />;
}

export function AnalyticsSectionLoading() {
  return (
    <section className={styles.state} aria-busy="true" aria-labelledby="analytics-loading-title">
      <h2 id="analytics-loading-title">방문 통계</h2>
      <p>방문 통계를 불러오고 있어요.</p>
    </section>
  );
}
