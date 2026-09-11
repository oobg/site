import { encodeRouteSlug } from '@lib/navigation/route-segment';

export const ROUTES = {
  HOME: '/',
  ABOUT: '/about',
  BLOG: {
    LIST: '/blog',
    DETAIL: (category: string, slug: string) =>
      `/blog/${encodeRouteSlug(category)}/${encodeRouteSlug(slug)}`,
  },
  PROJECTS: {
    LIST: '/projects',
    DETAIL: (slug: string) => `/projects/${slug}`,
  },
  ADMIN: {
    HOME: '/admin',
    ANALYTICS: '/admin/analytics',
    NEW_POST: '/admin/posts/new',
    POST: (id: string) => `/admin/posts/${id}`,
  },
} as const;

export function homeSearchHref(values: Record<string, string | string[] | number | undefined>) {
  const params = new URLSearchParams();
  for (const [key, raw] of Object.entries(values)) {
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (value !== undefined && String(value).trim()) params.set(key, String(value));
  }
  const query = params.toString();
  return query ? `/?${query}` : ROUTES.HOME;
}
