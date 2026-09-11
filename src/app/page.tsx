import { HydrationBoundary } from '@tanstack/react-query';
import { BlogHomeContainer } from '@/app/_container/BlogHomeContainer';
import { prefetchBlogHome } from '@features/posts/services/posts.prefetch';
import { normalizeBlogPostFilters } from '@features/posts/services/posts.query';
import { buildMetadata } from '@lib/metadata/metadata';

export const dynamic = 'force-dynamic';
export const metadata = buildMetadata({ path: '/' });

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const filters = normalizeBlogPostFilters({
    q: first(query.q),
    category: first(query.category),
    tag: first(query.tag),
    page: Number(first(query.page)) || 1,
    pageSize: 12,
  });
  const { data, dehydratedState } = await prefetchBlogHome(filters);
  return (
    <HydrationBoundary state={dehydratedState}>
      <BlogHomeContainer initialData={data} initialFilters={filters} />
    </HydrationBoundary>
  );
}
