import { SITE } from '@constants/site';
import type { BlogPost } from '@features/posts/types/posts.types';
import { siteUrl } from '@lib/metadata/metadata';

export const WEBSITE_ID = new URL('/#website', siteUrl).href;
export const AUTHOR_ID = new URL('/#author', siteUrl).href;

export function absoluteSiteUrl(path: string): string {
  return new URL(path, siteUrl).href;
}

/** JSON-LD를 inline script에 넣을 때 HTML parser가 script 종료 표기로 오인할 문자를 제거한다. */
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, (character) => {
    const codePoint = character.codePointAt(0);
    return codePoint === undefined ? '' : `\\u${codePoint.toString(16).padStart(4, '0')}`;
  });
}

export function buildSiteStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': WEBSITE_ID,
        url: absoluteSiteUrl('/'),
        name: SITE.name,
        author: { '@id': AUTHOR_ID },
      },
      {
        '@type': 'Person',
        '@id': AUTHOR_ID,
        name: SITE.author.name,
      },
    ],
  };
}

export function buildBlogPostingStructuredData(post: BlogPost, path: string) {
  const url = absoluteSiteUrl(path);
  const image = post.cover_image_url ? absoluteSiteUrl(post.cover_image_url) : undefined;
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${url}#article`,
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    headline: post.title,
    ...(post.summary ? { description: post.summary } : {}),
    datePublished: post.published_at,
    dateModified: post.updated_at,
    ...(image ? { image } : {}),
    author: { '@id': AUTHOR_ID },
    publisher: { '@id': AUTHOR_ID },
    isPartOf: { '@id': WEBSITE_ID },
    inLanguage: 'ko-KR',
  };
}
