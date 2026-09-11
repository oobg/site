import type { MetadataRoute } from 'next';
import { siteIndexable, siteUrl } from '@lib/metadata/metadata';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: siteIndexable
      ? { userAgent: '*', allow: '/', disallow: ['/admin', '/api'] }
      : { userAgent: '*', disallow: '/' },
    sitemap: siteIndexable ? new URL('/sitemap.xml', siteUrl).href : undefined,
  };
}
