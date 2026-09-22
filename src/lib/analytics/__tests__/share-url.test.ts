import { describe, expect, it } from 'vitest';
import { createBlogShareUrl } from '@lib/analytics/share-url';

describe('createBlogShareUrl', () => {
  it('공유 방식별 UTM을 붙이고 기존 query를 보존한다', () => {
    expect(createBlogShareUrl('https://raven.kr/blog/디자인-시스템/글?ref=home', 'copy')).toBe(
      'https://raven.kr/blog/%EB%94%94%EC%9E%90%EC%9D%B8-%EC%8B%9C%EC%8A%A4%ED%85%9C/%EA%B8%80?ref=home&utm_source=raven&utm_medium=share&utm_campaign=blog&utm_content=copy',
    );
  });

  it('native 공유는 copy와 다른 content로 기록한다', () => {
    expect(createBlogShareUrl('https://raven.kr/blog/dev/post', 'native_share')).toContain(
      'utm_content=native_share',
    );
  });
});
