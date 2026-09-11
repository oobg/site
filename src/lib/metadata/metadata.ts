import type { Metadata } from 'next';
import { SITE } from '@constants/site';

const DEFAULT_SITE_URL = 'https://raven.kr';

function getSiteUrl(): URL {
  const value = process.env.SITE_URL?.trim() || DEFAULT_SITE_URL;

  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('unsupported protocol');
    return url;
  } catch {
    throw new Error('SITE_URL은 유효한 절대 HTTP(S) URL이어야 합니다.');
  }
}

export const siteUrl = getSiteUrl();

function isSiteIndexable(): boolean {
  const value = process.env.SITE_INDEXABLE?.trim().toLowerCase();
  if (!value) return true;
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new Error('SITE_INDEXABLE은 true 또는 false여야 합니다.');
}

export const siteIndexable = isSiteIndexable();

export const baseMetadata: Metadata = {
  metadataBase: siteUrl,
  title: { default: SITE.name, template: `%s · ${SITE.name}` },
  description: SITE.description,
  alternates: {
    types: {
      'application/rss+xml': [{ url: '/rss.xml', title: `${SITE.name} RSS` }],
    },
  },
  openGraph: {
    type: 'website',
    siteName: SITE.name,
    url: siteUrl.href,
    description: SITE.description,
  },
  robots: { index: siteIndexable, follow: siteIndexable },
};

export function buildMetadata(input: {
  title?: string;
  description?: string;
  path?: string;
}): Metadata {
  const baseOg = baseMetadata.openGraph as Record<string, unknown>;
  return {
    title: input.title,
    description: input.description ?? SITE.description,
    alternates: {
      ...baseMetadata.alternates,
      canonical: input.path,
    },
    openGraph: {
      ...baseOg,
      title: input.title,
      description: input.description ?? SITE.description,
      url: input.path,
    },
  };
}

export function buildArticleMetadata(input: {
  title: string;
  description?: string;
  path: string;
  publishedTime: string;
  modifiedTime: string;
}): Metadata {
  const metadata = buildMetadata(input);
  return {
    ...metadata,
    openGraph: {
      ...(metadata.openGraph as Record<string, unknown>),
      type: 'article',
      publishedTime: input.publishedTime,
      modifiedTime: input.modifiedTime,
    },
  };
}
