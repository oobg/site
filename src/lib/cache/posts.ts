import 'server-only';

import { revalidateTag } from 'next/cache';

export interface InvalidatePublicPostOptions {
  oldSlug?: string | null;
  newSlug?: string | null;
}

/**
 * Call after publish/edit/unpublish/category/pin/reorder succeeds. Admin/private
 * queries are deliberately absent because they must never use this shared cache.
 */
export function invalidatePublicPostCache({
  oldSlug,
  newSlug,
}: InvalidatePublicPostOptions = {}): void {
  revalidateTag('posts', { expire: 0 });
  revalidateTag('post-categories', { expire: 0 });
  const slugs = [oldSlug, newSlug]
    .filter((value): value is string => Boolean(value))
    .map((slug) => slug.normalize('NFC'));
  for (const slug of new Set(slugs)) {
    revalidateTag(`post:${slug}`, { expire: 0 });
  }
}
