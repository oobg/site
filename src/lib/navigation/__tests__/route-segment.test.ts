import { describe, expect, it } from 'vitest';
import { encodeRouteSlug, isSafeRouteSlug } from '@lib/navigation/route-segment';

describe('isSafeRouteSlug', () => {
  it.each(['공개-글', 'my-post', 'a.b'])('한 세그먼트로 남는 키 %j를 통과시킨다', (slug) => {
    expect(isSafeRouteSlug(slug)).toBe(true);
  });

  it.each(['', '.', '..', 'a/b', 'a\\b', 'a%2fb', '\u0000', '‮'])(
    '경로를 벗어나거나 보이지 않는 키 %j를 막는다',
    (slug) => {
      expect(isSafeRouteSlug(slug)).toBe(false);
    },
  );
});

describe('encodeRouteSlug', () => {
  it('한글 키를 percent 인코딩한다', () => {
    expect(encodeRouteSlug('공개-글')).toBe('%EA%B3%B5%EA%B0%9C-%EA%B8%80');
  });

  it('안전하지 않은 키는 URL로 만들지 않는다', () => {
    expect(() => encodeRouteSlug('../etc')).toThrowError(URIError);
  });
});
