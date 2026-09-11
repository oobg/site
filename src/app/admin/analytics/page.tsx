import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { Container } from '@components/layout/Container';
import { ROUTES } from '@constants/routes';
import { AdminFrame } from '@features/admin/components/AdminFrame';
import {
  AnalyticsSection,
  AnalyticsSectionLoading,
} from '@features/admin/components/AnalyticsSection';
import { getOwnerAccess } from '@lib/auth/owner';

export const metadata = { title: '방문 통계' };

export default async function AdminAnalyticsPage() {
  const access = await getOwnerAccess();
  if (!access.authorized) redirect(ROUTES.ADMIN.HOME);
  return (
    <Container>
      <AdminFrame
        title="방문 통계"
        description="최근 28일의 사이트 방문 흐름을 확인합니다."
        userEmail={access.email ?? undefined}
      >
        <Suspense fallback={<AnalyticsSectionLoading />}>
          <AnalyticsSection />
        </Suspense>
      </AdminFrame>
    </Container>
  );
}
