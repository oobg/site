const IMAGE_ASSET_KEY =
  /^assets\/posts\/(\d{4}-\d{2}-\d{2})\/[A-Za-z0-9][A-Za-z0-9_-]{0,199}\.(jpg|png|gif|webp)$/;
/* 글 본문에 iframe으로 끼우는 HTML. 이미지와 경로를 나눠 두어야 CDN이 이 경로에만
   이미지 변환을 빼고 격리 헤더를 붙일 수 있다. */
const EMBED_ASSET_KEY =
  /^assets\/embeds\/(\d{4}-\d{2}-\d{2})\/[A-Za-z0-9][A-Za-z0-9_-]{0,199}\.html$/;

function matchesDatedKey(pattern: RegExp, key: string): boolean {
  const match = pattern.exec(key);
  if (!match || key.includes('..')) return false;
  const date = new Date(`${match[1]}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === match[1];
}

export function isImageAssetKey(key: string): boolean {
  return matchesDatedKey(IMAGE_ASSET_KEY, key);
}

export function isEmbedAssetKey(key: string): boolean {
  return matchesDatedKey(EMBED_ASSET_KEY, key);
}

/** 저장소가 받는 모든 키. 대표 이미지처럼 이미지만 와야 하는 자리는 isImageAssetKey를 쓴다. */
export function isAssetKey(key: string): boolean {
  return isImageAssetKey(key) || isEmbedAssetKey(key);
}

export function assertAssetKey(key: string) {
  if (!isAssetKey(key)) throw new Error('Invalid asset key');
}
