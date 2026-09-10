import { Suspense } from 'react';
import { BlogHomeSkeleton } from '@/app/_components/BlogLoadingSkeleton';
import { QueryAwareRootLoading } from '@/app/_components/QueryAwareRootLoading';

// 홈의 공통 블로그 shell과 카드 기하를 유지하는 route fallback.
export default function RootLoading() {
  return (
    <Suspense fallback={<BlogHomeSkeleton />}>
      <QueryAwareRootLoading />
    </Suspense>
  );
}
