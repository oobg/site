import type { Metadata } from 'next';

const SITE = {
  name: 'raven.kr',
  description: '생각을 다듬고 시스템으로 만드는 과정을 기록하는 공간.',
};

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
    alternates: input.path ? { canonical: input.path } : undefined,
    openGraph: {
      ...baseOg,
      title: input.title,
      description: input.description ?? SITE.description,
      url: input.path,
    },
  };
}
