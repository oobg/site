/** Safe decoded content key: it must remain a single segment after URL parsing. */
export function isSafeRouteSlug(slug: string): boolean {
  return Boolean(slug) && slug !== '.' && slug !== '..' && !/[/\\%\p{Cc}\p{Cf}]/u.test(slug);
}

/** canonical·RSS처럼 절대 URL을 만들 때 쓴다. 안전하지 않은 키는 URL로 만들지 않는다. */
export function encodeRouteSlug(slug: string): string {
  if (!isSafeRouteSlug(slug)) throw new URIError('Invalid route slug');
  return encodeURIComponent(slug);
}
