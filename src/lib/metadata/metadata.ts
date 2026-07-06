import type { Metadata } from 'next';

const SITE = {
  name: 'raven.kr',
  description: '생각을 다듬고 시스템으로 만드는 과정을 기록하는 공간.',
  url: 'https://raven.kr',
};

export const baseMetadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: SITE.name, template: `%s · ${SITE.name}` },
  description: SITE.description,
  openGraph: { type: 'website', siteName: SITE.name, url: SITE.url, description: SITE.description },
  robots: { index: true, follow: true },
};

export function buildMetadata(input: {
  title?: string;
  description?: string;
  path?: string;
}): Metadata {
  return {
    title: input.title,
    description: input.description,
    openGraph: {
      title: input.title,
      description: input.description,
      url: input.path,
    },
  };
}
