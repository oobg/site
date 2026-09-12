import 'server-only';

import { CmsConfigurationError } from '@configs/cms-env';
import { getCloudflareAccessConfig, verifyCloudflareAccess } from '@lib/auth/cloudflare-access';
import { OwnerAuthorizationError, requireOwner } from '@lib/auth/owner';
import { createClient } from '@lib/supabase/server';
import { createServiceClient } from '@lib/supabase/service';

export type AdminApiAccess = { mode: 'owner' | 'access'; actor: string };

export async function requireAdminApiAccess(request: Request): Promise<AdminApiAccess> {
  const expectedOrigin = process.env.SITE_URL?.trim().replace(/\/$/, '');
  if (!expectedOrigin) throw new CmsConfigurationError('SITE_URL 설정이 필요합니다.');
  const origin = request.headers.get('origin');
  if (origin !== null && origin !== expectedOrigin)
    throw new OwnerAuthorizationError('허용되지 않은 요청 출처입니다.', 403);

  // A partial Access configuration fails closed, including cookie requests.
  const config = getCloudflareAccessConfig();
  let ownerError: OwnerAuthorizationError | undefined;
  if (origin === expectedOrigin) {
    try {
      const owner = await requireOwner();
      return { mode: 'owner', actor: owner.email! };
    } catch (error) {
      if (!(error instanceof OwnerAuthorizationError)) throw error;
      ownerError = error;
    }
  }
  const token = request.headers.get('cf-access-jwt-assertion');
  if (config && token) return verifyCloudflareAccess(token, config);
  if (ownerError) throw ownerError;
  throw new OwnerAuthorizationError(
    '검증된 Access 인증 또는 동일 출처의 로그인이 필요합니다.',
    403,
  );
}

export async function createAdminApiClient(access: AdminApiAccess) {
  try {
    return access.mode === 'access' ? createServiceClient() : await createClient();
  } catch {
    throw new CmsConfigurationError('관리자 데이터베이스를 사용할 수 없습니다.');
  }
}
