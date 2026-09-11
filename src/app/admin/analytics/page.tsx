import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { AdminFrame } from '@features/admin/components/AdminFrame';
import {
  AnalyticsSection,
  AnalyticsSectionLoading,
} from '@features/admin/components/AnalyticsSection';
import { getOwnerAccess } from '@lib/auth/owner';
import { ROUTES } from '@constants/routes';

export const metadata = { title: '방문 통계' };

export default async function AdminAnalyticsPage() {
  const access = await getOwnerAccess();
  if (!access.authorized) redirect(ROUTES.ADMIN.HOME);
  return (
    <AdminFrame title="방문 통계" description="최근 28일의 사이트 방문 흐름을 확인합니다.">
      <Suspense fallback={<AnalyticsSectionLoading />}>
        <AnalyticsSection />
      </Suspense>
    </AdminFrame>
  );
}
