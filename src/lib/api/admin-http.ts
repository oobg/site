import { NextResponse } from 'next/server';
import { CmsConfigurationError } from '@configs/cms-env';
import { OwnerAuthorizationError } from '@lib/auth/owner';

export class AdminApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export const adminJson = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

export function adminError(error: unknown) {
  if (error instanceof AdminApiError)
    return adminJson({ error: { code: error.code, message: error.message } }, error.status);
  if (error instanceof OwnerAuthorizationError)
    return adminJson(
      {
        error: {
          code:
            error.status === 503
              ? 'AUTH_UNAVAILABLE'
              : error.status === 401
                ? 'UNAUTHORIZED'
                : 'FORBIDDEN',
          message: error.message,
        },
      },
      error.status,
    );
  if (error instanceof CmsConfigurationError)
    return adminJson(
      { error: { code: 'NOT_CONFIGURED', message: '서버 설정을 확인해 주세요.' } },
      503,
    );
  return adminJson(
    { error: { code: 'INTERNAL_ERROR', message: '요청을 처리하지 못했습니다.' } },
    500,
  );
}

/** Enforce actual bytes too, even with a missing/forged Content-Length. */
export async function readLimitedBody(
  request: Request,
  limit: number,
): Promise<Uint8Array<ArrayBuffer>> {
  if (Number(request.headers.get('content-length')) > limit)
    throw new AdminApiError(413, 'PAYLOAD_TOO_LARGE', '요청 본문이 너무 큽니다.');
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new AdminApiError(413, 'PAYLOAD_TOO_LARGE', '요청 본문이 너무 큽니다.');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const result = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}
