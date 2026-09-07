import 'server-only';

import { CmsConfigurationError, getOwnerEmails } from '@configs/cms-env';
import { createClient } from '@lib/supabase/server';

export interface OwnerAccess {
  configured: boolean;
  authenticated: boolean;
  authorized: boolean;
  email: string | null;
}

export class OwnerAuthorizationError extends Error {
  constructor(
    message: string,
    public readonly status: 401 | 403 | 503,
  ) {
    super(message);
    this.name = 'OwnerAuthorizationError';
  }
}

export async function getOwnerAccess(): Promise<OwnerAccess> {
  const ownerEmails = getOwnerEmails();
  if (ownerEmails.size === 0) {
    return { configured: false, authenticated: false, authorized: false, email: null };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    const email = data.user?.email?.trim().toLowerCase() ?? null;
    const isVerifiedGoogleUser =
      Boolean(data.user?.email_confirmed_at) &&
      (data.user?.app_metadata.provider === 'google' ||
        (Array.isArray(data.user?.app_metadata.providers) &&
          data.user.app_metadata.providers.includes('google')));

    if (error || !email || !isVerifiedGoogleUser) {
      return { configured: true, authenticated: false, authorized: false, email: null };
    }

    if (!ownerEmails.has(email)) {
      return { configured: true, authenticated: true, authorized: false, email };
    }

    const { data: databaseAllowsOwner, error: ownerCheckError } =
      await supabase.rpc('is_cms_owner');

    return {
      configured: true,
      authenticated: true,
      authorized: !ownerCheckError && databaseAllowsOwner === true,
      email,
    };
  } catch (error) {
    if (error instanceof CmsConfigurationError) {
      return { configured: false, authenticated: false, authorized: false, email: null };
    }
    throw error;
  }
}

export async function requireOwner() {
  const access = await getOwnerAccess();
  if (!access.configured) {
    throw new OwnerAuthorizationError('CMS가 설정되지 않았습니다.', 503);
  }
  if (!access.authenticated) {
    throw new OwnerAuthorizationError('로그인이 필요합니다.', 401);
  }
  if (!access.authorized) {
    throw new OwnerAuthorizationError('관리자 권한이 없습니다.', 403);
  }
  return access;
}
