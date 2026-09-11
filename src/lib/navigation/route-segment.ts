/** Safe decoded content key: it must remain a single segment after URL parsing. */
export function isSafeRouteSlug(slug: string): boolean {
  return Boolean(slug) && slug !== '.' && slug !== '..' && !/[/\\%\p{Cc}\p{Cf}]/u.test(slug);
}

export function encodeRouteSlug(slug: string): string {
  if (!isSafeRouteSlug(slug)) throw new URIError('Invalid route slug');
  return encodeURIComponent(slug);
}
