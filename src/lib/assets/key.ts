const ASSET_KEY =
  /^assets\/posts\/(\d{4}-\d{2}-\d{2})\/[A-Za-z0-9][A-Za-z0-9_-]{0,199}\.(jpg|png|gif|webp)$/;

export function isAssetKey(key: string): boolean {
  const match = ASSET_KEY.exec(key);
  if (!match || key.includes('..')) return false;
  const date = new Date(`${match[1]}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === match[1];
}

export function assertAssetKey(key: string) {
  if (!isAssetKey(key)) throw new Error('Invalid asset key');
}
