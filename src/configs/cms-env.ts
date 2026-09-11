import 'server-only';
import path from 'node:path';

const splitEmails = (value: string | undefined) =>
  new Set(
    (value ?? '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );

export class CmsConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CmsConfigurationError';
  }
}

export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url || !publishableKey) {
    throw new CmsConfigurationError('Supabase 환경 변수가 설정되지 않았습니다.');
  }

  return { url, publishableKey };
}

export function getOwnerEmails() {
  return splitEmails(process.env.CMS_OWNER_EMAILS);
}

export function getR2Config() {
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucket = process.env.R2_BUCKET?.trim();
  const publicUrl = process.env.R2_PUBLIC_URL?.trim().replace(/\/$/, '');

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) {
    throw new CmsConfigurationError('R2 환경 변수가 설정되지 않았습니다.');
  }

  return { accountId, accessKeyId, secretAccessKey, bucket, publicUrl };
}

export type AssetStorageConfig =
  | ({ backend: 'r2' } & ReturnType<typeof getR2Config>)
  | { backend: 'local'; root: string; publicUrl: string };

export function getAssetStorageConfig(): AssetStorageConfig {
  const backend = process.env.ASSET_STORAGE_BACKEND?.trim().toLowerCase() || 'r2';
  const configuredPublicUrl = process.env.ASSET_PUBLIC_URL?.trim().replace(/\/+$/, '');

  if (backend === 'r2') {
    const r2 = getR2Config();
    return { backend, ...r2 };
  }

  if (backend !== 'local') {
    throw new CmsConfigurationError('지원하지 않는 이미지 저장소 backend입니다.');
  }

  const root = process.env.ASSET_LOCAL_ROOT?.trim();
  if (!root || !path.isAbsolute(root) || !configuredPublicUrl) {
    throw new CmsConfigurationError('로컬 이미지 저장소 환경 변수가 설정되지 않았습니다.');
  }
  let publicUrl: URL;
  try {
    publicUrl = new URL(configuredPublicUrl);
  } catch {
    throw new CmsConfigurationError('로컬 이미지 저장소 공개 주소가 올바르지 않습니다.');
  }
  if (
    publicUrl.protocol !== 'https:' ||
    publicUrl.username ||
    publicUrl.password ||
    publicUrl.pathname !== '/' ||
    publicUrl.search ||
    publicUrl.hash
  ) {
    throw new CmsConfigurationError('로컬 이미지 저장소 공개 주소가 올바르지 않습니다.');
  }

  const r2SecretNames = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET'];
  if (r2SecretNames.some((name) => process.env[name]?.trim())) {
    throw new CmsConfigurationError(
      '로컬 이미지 저장소에 R2 credentials를 함께 설정할 수 없습니다.',
    );
  }

  return { backend, root: path.resolve(root), publicUrl: publicUrl.origin };
}
