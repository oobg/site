export type BlogShareMethod = 'copy' | 'native_share';

const BLOG_SHARE_UTM = {
  utm_source: 'raven',
  utm_medium: 'share',
  utm_campaign: 'blog',
} as const;

/** 공유·복사로 유입된 글만 GA4에서 구분할 수 있도록 UTM을 붙인다. */
export function createBlogShareUrl(url: string, method: BlogShareMethod): string {
  const sharedUrl = new URL(url);
  for (const [key, value] of Object.entries({
    ...BLOG_SHARE_UTM,
    utm_content: method,
  })) {
    sharedUrl.searchParams.set(key, value);
  }
  return sharedUrl.toString();
}
