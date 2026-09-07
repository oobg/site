import 'server-only';

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
