import type { MetadataRoute } from 'next';
import { getPosts } from '@features/posts/services/posts.api';
import { getProjects } from '@features/projects/services/projects.api';
import { siteIndexable, siteUrl } from '@lib/metadata/metadata';
import { DEFAULT_POST_CATEGORY_SLUG } from '@features/posts/types/posts.types';
import { ROUTES } from '@constants/routes';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!siteIndexable) return [];

  const [posts, projects] = await Promise.all([getPosts(), getProjects()]);
  const origin = siteUrl.origin;

  const entries: MetadataRoute.Sitemap = [
    { url: new URL(ROUTES.HOME, origin).href },
    { url: new URL(ROUTES.ABOUT, origin).href },
    ...posts.map((post) => ({
      url: new URL(
        ROUTES.BLOG.DETAIL(post.category?.slug ?? DEFAULT_POST_CATEGORY_SLUG, post.slug),
        origin,
      ).href,
      lastModified: post.updated_at,
    })),
    { url: new URL(ROUTES.PROJECTS.LIST, origin).href },
    ...projects.map((project) => ({
      url: new URL(ROUTES.PROJECTS.DETAIL(project.slug), origin).href,
      lastModified: project.updated_at,
    })),
  ];

  const seen = new Set<string>();
  return entries.filter((entry) => {
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });
}

export const dynamic = 'force-dynamic';
