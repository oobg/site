const COMMENT_AVATAR_ID = /^clay-(0[1-9]|[1-5][0-9]|6[0-4])$/;
export const DEFAULT_COMMENT_AVATAR_BASE_URL = 'https://cdn.raven.kr/assets/comment-avatars';

type AssetPublicUrls = {
  R2_PUBLIC_URL?: string;
};

export function getCommentAvatarBaseUrl(config: AssetPublicUrls): string | undefined {
  const publicUrl = config.R2_PUBLIC_URL;
  const normalized = publicUrl?.trim().replace(/\/+$/, '');
  return normalized ? `${normalized}/assets/comment-avatars` : undefined;
}

function normalizeAvatarBaseUrl(avatarBaseUrl?: string): string {
  const normalized = avatarBaseUrl?.trim().replace(/\/+$/, '');
  if (!normalized) return DEFAULT_COMMENT_AVATAR_BASE_URL;

  try {
    const url = new URL(normalized);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
      return DEFAULT_COMMENT_AVATAR_BASE_URL;
    }
  } catch {
    return DEFAULT_COMMENT_AVATAR_BASE_URL;
  }

  return normalized;
}

export function getCommentAvatarUrl(avatarId: string, avatarBaseUrl?: string): string {
  if (!COMMENT_AVATAR_ID.test(avatarId)) throw new Error('Invalid comment avatar id');
  return `${normalizeAvatarBaseUrl(avatarBaseUrl)}/${avatarId}.webp`;
}
