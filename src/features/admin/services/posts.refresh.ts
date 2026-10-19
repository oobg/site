import 'server-only';
import { logOperation } from '@lib/observability/logger';
import { revalidatePath } from 'next/cache';
import { ROUTES } from '@constants/routes';
import { invalidatePublicPostCache } from '@lib/cache/posts';

function revalidatePostPaths(slugs: (string | undefined)[], includeCategoryRoute: boolean) {
  const paths = new Set([
    ROUTES.HOME,
    ROUTES.BLOG.LIST,
    ROUTES.ADMIN.HOME,
    ...(includeCategoryRoute ? ['/blog/[category]/[slug]'] : []),
    ...slugs
      .filter((slug): slug is string => Boolean(slug))
      .map((slug) => `/blog/${encodeURIComponent(slug)}`),
  ]);
  for (const path of paths) {
    try {
      if (path === '/blog/[category]/[slug]') revalidatePath(path, 'page');
      else revalidatePath(path);
    } catch {
      logOperation({ operation: 'post_path_revalidation', code: 'CACHE_REVALIDATION_FAILED' });
    }
  }
}

export function refreshPostPaths(...slugs: (string | undefined)[]) {
  revalidatePostPaths(slugs, true);
}

export function refreshApiPostPaths(...slugs: (string | undefined)[]) {
  revalidatePostPaths(slugs, false);
}

export function refreshPublicPostCache(oldSlug?: string, newSlug?: string) {
  try {
    invalidatePublicPostCache({ oldSlug, newSlug });
  } catch {
    logOperation({ operation: 'post_cache_invalidation', code: 'CACHE_INVALIDATION_FAILED' });
  }
}
