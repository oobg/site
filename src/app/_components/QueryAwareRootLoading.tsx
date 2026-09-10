'use client';

import { useSearchParams } from 'next/navigation';
import { BlogArchiveSkeleton, BlogHomeSkeleton } from '@/app/_components/BlogLoadingSkeleton';

export function QueryAwareRootLoading() {
  const searchParams = useSearchParams();
  const archive =
    searchParams.get('view') === 'all' ||
    Boolean(searchParams.get('q') || searchParams.get('category') || searchParams.get('tag')) ||
    Number(searchParams.get('page')) > 1;
  return archive ? <BlogArchiveSkeleton /> : <BlogHomeSkeleton />;
}
