import { describe, expect, it } from 'vitest';
import { ROUTES } from '@constants/routes';

describe('blog detail routes', () => {
  it('builds canonical category and post segments', () => {
    expect(ROUTES.BLOG.DETAIL('dev', 'my-post')).toBe('/blog/dev/my-post');
  });

  it('encodes each segment and keeps query/hash characters inside the slug', () => {
    const path = ROUTES.BLOG.DETAIL('개발', '한글?#글');
    expect(path).toBe(`/blog/${encodeURIComponent('개발')}/${encodeURIComponent('한글?#글')}`);
    const url = new URL(path, 'https://raven.kr');
    expect(url.search).toBe('');
    expect(url.hash).toBe('');
  });

  it.each(['', '.', '..', 'a/b', 'a\\b', '%2f', '\u0000', '\n', '\u202e'])(
    'rejects unsafe segment %j in either position',
    (value) => {
      expect(() => ROUTES.BLOG.DETAIL(value, 'my-post')).toThrow(URIError);
      expect(() => ROUTES.BLOG.DETAIL('dev', value)).toThrow(URIError);
    },
  );
});
