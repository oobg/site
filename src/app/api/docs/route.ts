import { NextResponse } from 'next/server';

import { apiSpecification } from '@lib/api/openapi';
import {
  getCloudflareDocsAccessConfig,
  verifyCloudflareAccessJwt,
} from '@lib/auth/cloudflare-access';
import { OwnerAuthorizationError } from '@lib/auth/owner';

export const runtime = 'nodejs';
const headers = { 'Cache-Control': 'private, no-store', Vary: 'Cf-Access-Jwt-Assertion' };
const docsEmail = 'yoonseok.bae98@gmail.com';
const denied = (status = 403) =>
  NextResponse.json(
    { error: { code: 'DOCS_FORBIDDEN', message: 'API 문서 접근 권한이 없습니다.' } },
    { status, headers },
  );

export async function GET(request: Request) {
  // This route deliberately has no Google-session or service-identity fallback.
  if (process.env.SITE_URL?.trim().replace(/\/$/, '') !== 'https://raven.kr') return denied();
  try {
    const config = getCloudflareDocsAccessConfig();
    if (!config) return denied();
    const token = request.headers.get('cf-access-jwt-assertion');
    if (!token) return denied(401);
    const identity = await verifyCloudflareAccessJwt(token, config);
    if (typeof identity.email !== 'string' || identity.email.toLowerCase() !== docsEmail)
      return denied();
    return NextResponse.json(apiSpecification, { headers });
  } catch (error) {
    return denied(error instanceof OwnerAuthorizationError && error.status === 401 ? 401 : 403);
  }
}
