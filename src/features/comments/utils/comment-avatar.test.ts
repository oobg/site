import { describe, expect, it } from 'vitest';

import {
  DEFAULT_COMMENT_AVATAR_BASE_URL,
  getCommentAvatarBaseUrl,
  getCommentAvatarUrl,
} from './comment-avatar';

describe('comment avatar URL', () => {
  it('uses the production CDN fallback when no configured CDN base is provided', () => {
    expect(getCommentAvatarUrl('clay-01')).toBe(`${DEFAULT_COMMENT_AVATAR_BASE_URL}/clay-01.webp`);
  });

  it('does not emit relative or insecure avatar URLs', () => {
    expect(getCommentAvatarUrl('clay-01', '/legacy/avatar')).toBe(
      `${DEFAULT_COMMENT_AVATAR_BASE_URL}/clay-01.webp`,
    );
    expect(getCommentAvatarUrl('clay-01', 'http://cdn.example.com/assets/comment-avatars')).toBe(
      `${DEFAULT_COMMENT_AVATAR_BASE_URL}/clay-01.webp`,
    );
  });

  it('normalizes a CDN base and accepts the complete clay-01 through clay-64 contract', () => {
    for (let index = 1; index <= 64; index += 1) {
      const avatarId = `clay-${String(index).padStart(2, '0')}`;
      expect(
        getCommentAvatarUrl(avatarId, 'https://cdn.example.com/assets/comment-avatars///'),
      ).toBe(`https://cdn.example.com/assets/comment-avatars/${avatarId}.webp`);
    }
    expect(() => getCommentAvatarUrl('clay-00')).toThrow('Invalid comment avatar id');
    expect(() => getCommentAvatarUrl('clay-65')).toThrow('Invalid comment avatar id');
  });

  it('selects and normalizes the configured R2 public origin', () => {
    expect(
      getCommentAvatarBaseUrl({
        R2_PUBLIC_URL: 'https://cdn.raven.kr///',
      }),
    ).toBe('https://cdn.raven.kr/assets/comment-avatars');
    expect(
      getCommentAvatarBaseUrl({
        R2_PUBLIC_URL: 'https://cdn.raven.kr',
      }),
    ).toBe('https://cdn.raven.kr/assets/comment-avatars');
    expect(getCommentAvatarBaseUrl({})).toBeUndefined();
  });
});
