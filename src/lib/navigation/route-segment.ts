/** 디코드된 콘텐츠 키가 URL 한 세그먼트로 남는지 본다. 경로 이탈·제어문자는 키가 될 수 없다. */
export function isSafeRouteSlug(slug: string): boolean {
  return Boolean(slug) && slug !== '.' && slug !== '..' && !/[/\\%\p{Cc}\p{Cf}]/u.test(slug);
}

/** canonical·RSS처럼 절대 URL을 만들 때 쓴다. 안전하지 않은 키는 URL로 만들지 않는다. */
export function encodeRouteSlug(slug: string): string {
  if (!isSafeRouteSlug(slug)) throw new URIError('Invalid route slug');
  return encodeURIComponent(slug);
}
