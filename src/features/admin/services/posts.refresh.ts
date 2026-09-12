import 'server-only';
import { revalidatePath } from 'next/cache';
import { ROUTES } from '@constants/routes';
import { invalidatePublicPostCache } from '@lib/cache/posts';

export function refreshPostPaths(...slugs: (string | undefined)[]) {
  const paths = new Set([
    ROUTES.HOME,
    ROUTES.BLOG.LIST,
    ROUTES.ADMIN.HOME,
    ...slugs.filter((slug): slug is string => Boolean(slug)).map(ROUTES.BLOG.DETAIL),
  ]);
  for (const path of paths) {
    try {
      revalidatePath(path);
    } catch {
      // Do not log slugs or request-derived values.
      console.error('Post cache revalidation failed');
    }
  }
}

export function refreshPublicPostCache(oldSlug?: string, newSlug?: string) {
  try {
    invalidatePublicPostCache({ oldSlug, newSlug });
  } catch {
    console.error('Post data cache invalidation failed');
  }
}
