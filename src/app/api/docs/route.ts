import { NextResponse } from 'next/server';

import { apiSpecification } from '@lib/api/openapi';
import {
  getCloudflareDocsAccessConfig,
  verifyCloudflareAccessJwt,
} from '@lib/auth/cloudflare-access';
import { OwnerAuthorizationError } from '@lib/auth/owner';
import { renderApiDocsPage } from './docs-page';

export const runtime = 'nodejs';
const headers = {
  'Cache-Control': 'private, no-store',
  Vary: 'Cf-Access-Jwt-Assertion, Accept',
  'X-Content-Type-Options': 'nosniff',
};
const docsEmail = 'yoonseok.bae98@gmail.com';
const acceptsHtml = (accept: string | null) =>
  accept?.split(',').some((entry) => {
    const [mediaType, ...parameters] = entry.trim().toLowerCase().split(';');
    const quality = parameters.find((parameter) => parameter.trim().startsWith('q='));
    const qualityValue = quality ? Number.parseFloat(quality.split('=')[1] ?? '') : 1;
    return mediaType === 'text/html' && (Number.isNaN(qualityValue) || qualityValue > 0);
  }) ?? false;
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
    const format = new URL(request.url).searchParams.get('format')?.toLowerCase();
    const wantsRawSpecification = format === 'json' || format === 'raw';
    if (!wantsRawSpecification && acceptsHtml(request.headers.get('accept'))) {
      return new Response(renderApiDocsPage(apiSpecification), {
        headers: {
          ...headers,
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Security-Policy':
            "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
        },
      });
    }
    return NextResponse.json(apiSpecification, { headers });
  } catch (error) {
    return denied(error instanceof OwnerAuthorizationError && error.status === 401 ? 401 : 403);
  }
}
