import { describe, expect, it } from 'vitest';
import { normalizeRouteSlug } from '@lib/navigation/slug';

describe('normalizeRouteSlug', () => {
  it('percent 인코딩된 한글 경로를 해독한다', () => {
    expect(normalizeRouteSlug('%ED%95%9C%EA%B8%80-%EA%B8%80')).toBe('한글-글');
  });

  it('분해된 유니코드를 콘텐츠 키와 같은 NFC로 정규화한다', () => {
    expect(normalizeRouteSlug('공개-글')).toBe('공개-글');
  });

  it.each(['%', '%E0%A4%A', 'post%ZZ'])('잘못된 percent 경로 %s는 notFound로 보낸다', (slug) => {
    expect(() => normalizeRouteSlug(slug)).toThrowError(
      expect.objectContaining({ digest: 'NEXT_HTTP_ERROR_FALLBACK;404' }),
    );
  });
});
