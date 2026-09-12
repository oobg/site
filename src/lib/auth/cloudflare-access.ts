import 'server-only';

import { createRemoteJWKSet, errors, jwtVerify } from 'jose';
import { CmsConfigurationError } from '@configs/cms-env';
import { OwnerAuthorizationError } from '@lib/auth/owner';

type CloudflareAccessConfig = {
  issuer: string;
  audience: string;
  certsUrl: string;
};

function parseCloudflareAccessConfig(
  teamValue: string | undefined,
  audienceValue: string | undefined,
) {
  const team = teamValue?.trim();
  const audience = audienceValue?.trim();
  if (!team && !audience) return null;
  if (!team || !audience) throw new CmsConfigurationError('Access 설정이 불완전합니다.');
  let url: URL;
  try {
    url = new URL(team);
  } catch {
    throw new CmsConfigurationError('Access 팀 도메인이 올바르지 않습니다.');
  }
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash ||
    (team !== url.origin && team !== `${url.origin}/`)
  )
    throw new CmsConfigurationError('Access 팀 도메인은 HTTPS origin이어야 합니다.');
  return { issuer: url.origin, audience, certsUrl: `${url.origin}/cdn-cgi/access/certs` };
}

export function getCloudflareAccessConfig(): CloudflareAccessConfig | null {
  return parseCloudflareAccessConfig(
    process.env.CLOUDFLARE_ACCESS_TEAM_DOMAIN,
    process.env.CLOUDFLARE_ACCESS_AUDIENCE,
  );
}

export function getCloudflareDocsAccessConfig(): CloudflareAccessConfig | null {
  return parseCloudflareAccessConfig(
    process.env.CLOUDFLARE_ACCESS_TEAM_DOMAIN,
    process.env.CLOUDFLARE_API_DOCS_ACCESS_AUDIENCE,
  );
}

// Reuse jose's bounded JWKS cache and key-rotation handling across requests.
let remote: { url: string; keys: ReturnType<typeof createRemoteJWKSet> } | undefined;

export async function verifyCloudflareAccessJwt(
  token: string,
  config: NonNullable<ReturnType<typeof getCloudflareAccessConfig>>,
) {
  if (!token || token.length > 32_768)
    throw new OwnerAuthorizationError('Access 인증이 올바르지 않습니다.', 401);
  if (remote?.url !== config.certsUrl) {
    remote = { url: config.certsUrl, keys: createRemoteJWKSet(new URL(config.certsUrl)) };
  }
  try {
    const { payload } = await jwtVerify(token, remote.keys, {
      issuer: config.issuer,
      audience: config.audience,
      algorithms: ['RS256'],
      requiredClaims: ['exp', 'iss', 'aud'],
    });
    return payload;
  } catch (error) {
    if (error instanceof errors.JOSEError && error.code !== 'ERR_JWKS_TIMEOUT')
      throw new OwnerAuthorizationError('Access 인증이 올바르지 않습니다.', 401);
    throw new OwnerAuthorizationError('Access 인증 서비스를 사용할 수 없습니다.', 503);
  }
}

export async function verifyCloudflareAccess(
  token: string,
  config: NonNullable<ReturnType<typeof getCloudflareAccessConfig>>,
) {
  const payload = await verifyCloudflareAccessJwt(token, config);
  // Service tokens need not carry a user email or a nonempty subject.
  return { mode: 'access' as const, actor: payload.sub || 'cloudflare-access' };
}
