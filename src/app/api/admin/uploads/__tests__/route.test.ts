import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { File as NodeFile } from 'node:buffer';

const mocks = vi.hoisted(() => ({
  requireOwner: vi.fn(),
  getAssetStorageConfig: vi.fn(),
  storeAsset: vi.fn(),
  verifyAccess: vi.fn(),
}));

vi.mock('@lib/auth/owner', () => ({
  OwnerAuthorizationError: class OwnerAuthorizationError extends Error {
    status: number;
    constructor(message: string, status = 403) {
      super(message);
      this.status = status;
    }
  },
  requireOwner: mocks.requireOwner,
}));

vi.mock('@configs/cms-env', () => ({
  CmsConfigurationError: class CmsConfigurationError extends Error {},
  getAssetStorageConfig: mocks.getAssetStorageConfig,
}));

vi.mock('@lib/assets/storage', () => ({ storeAsset: mocks.storeAsset }));
vi.mock('@lib/auth/cloudflare-access', () => ({
  getCloudflareAccessConfig: () => ({}),
  verifyCloudflareAccess: mocks.verifyAccess,
}));

import { POST } from '@/app/api/admin/uploads/route';

async function uploadRequest(
  file: File,
  origin: string | null = 'https://dev.raven.kr',
  key?: string,
  token?: string,
) {
  const bytes = await file.arrayBuffer();
  const boundary = 'raven-upload-test';
  const body = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="image.png"\r\nContent-Type: ${file.type}\r\n\r\n`,
    ),
    Buffer.from(bytes),
    Buffer.from(
      `\r\n${key === undefined ? '' : `--${boundary}\r\nContent-Disposition: form-data; name="key"\r\n\r\n${key}\r\n`}--${boundary}--\r\n`,
    ),
  ]);
  return new Request('https://dev.raven.kr/api/admin/uploads', {
    method: 'POST',
    body,
    headers: {
      'content-type': `multipart/form-data; boundary=${boundary}`,
      ...(origin === null ? {} : { origin }),
      ...(token ? { 'cf-access-jwt-assertion': token } : {}),
    },
  });
}

describe('POST /api/admin/uploads', () => {
  beforeEach(() => {
    // Route runs on Node; undici's multipart parser requires Node's File brand.
    vi.stubGlobal('File', NodeFile);
    mocks.requireOwner.mockReset().mockResolvedValue({ email: 'owner@example.com' });
    mocks.verifyAccess.mockReset().mockResolvedValue({ mode: 'access', actor: 'test' });
    mocks.getAssetStorageConfig.mockReset();
    mocks.storeAsset.mockReset();
    process.env.SITE_URL = 'https://dev.raven.kr';
    mocks.getAssetStorageConfig.mockReturnValue({
      backend: 'local',
      root: '/srv/assets',
      publicUrl: 'https://cdn-dev.raven.kr',
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    delete process.env.SITE_URL;
  });

  it('rejects a different origin before owner authorization', async () => {
    const response = await POST(
      await uploadRequest(
        new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], 'a.png', { type: 'image/png' }),
        'https://evil.example',
      ),
    );
    expect(response.status).toBe(403);
    expect(mocks.requireOwner).not.toHaveBeenCalled();
  });

  it('preserves owner authorization failures', async () => {
    const { OwnerAuthorizationError } = await import('@lib/auth/owner');
    mocks.requireOwner.mockRejectedValue(new OwnerAuthorizationError('로그인이 필요합니다.', 401));
    const response = await POST(
      await uploadRequest(
        new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], 'a.png', { type: 'image/png' }),
      ),
    );
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다.' },
    });
  });

  it('rejects unsupported MIME types and mismatched image signatures', async () => {
    const unsupported = await POST(
      await uploadRequest(new File(['text'], 'a.txt', { type: 'text/plain' })),
    );
    expect(unsupported.status).toBe(415);

    const mismatch = await POST(
      await uploadRequest(new File(['not-png'], 'a.png', { type: 'image/png' })),
    );
    expect(mismatch.status).toBe(415);
    expect(mocks.storeAsset).not.toHaveBeenCalled();
  });

  it('keeps the 10MB upload limit', async () => {
    const response = await POST(
      await uploadRequest(
        new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'large.png', { type: 'image/png' }),
      ),
    );
    expect(response.status).toBe(400);
    expect(mocks.storeAsset).not.toHaveBeenCalled();
  });

  it('rejects an oversized declared multipart body before parsing it', async () => {
    const formData = vi.fn();
    const response = await POST({
      url: 'https://dev.raven.kr/api/admin/uploads',
      headers: new Headers({
        origin: 'https://dev.raven.kr',
        'content-length': String(12 * 1024 * 1024),
      }),
      formData,
    } as unknown as Request);

    expect(response.status).toBe(413);
    expect(formData).not.toHaveBeenCalled();
  });

  it('returns 400 for malformed multipart data', async () => {
    const response = await POST({
      url: 'https://dev.raven.kr/api/admin/uploads',
      headers: new Headers({ origin: 'https://dev.raven.kr' }),
      formData: vi.fn().mockRejectedValue(new TypeError('bad boundary')),
    } as unknown as Request);

    expect(response.status).toBe(400);
    expect(mocks.storeAsset).not.toHaveBeenCalled();
  });

  it.each(['https://cdn-dev.raven.kr', 'https://cdn.raven.kr'])(
    'preserves explicit key and configured CDN %s',
    async (publicUrl) => {
      mocks.getAssetStorageConfig.mockReturnValue({ publicUrl });
      const key = 'assets/posts/2026-09-10/design-system-00-v2.png';
      const response = await POST(
        await uploadRequest(
          new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], 'a.png', { type: 'image/png' }),
          'https://dev.raven.kr',
          key,
        ),
      );
      expect(response.status).toBe(201);
      expect(await response.json()).toMatchObject({ publicUrl: `${publicUrl}/${key}` });
      expect(mocks.storeAsset.mock.calls[0][1].key).toBe(key);
    },
  );

  it.each([
    '../escape.png',
    '/assets/posts/2026-09-10/a.png',
    'assets/posts/2026-09-10/../a.png',
    'assets/posts/2026-09-10/a.svg',
    'assets/posts/2026-09-10/a.jpg',
  ])('rejects traversal or mismatched extension %s', async (key) => {
    const response = await POST(
      await uploadRequest(
        new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], 'a.png', { type: 'image/png' }),
        'https://dev.raven.kr',
        key,
      ),
    );
    expect(response.status).toBe(422);
    expect(mocks.storeAsset).not.toHaveBeenCalled();
  });

  it.each([{ code: 'EEXIST' }, { name: 'PreconditionFailed', $metadata: { httpStatusCode: 412 } }])(
    'reports same-key conflicts safely',
    async (error) => {
      mocks.storeAsset.mockRejectedValue({ ...error, message: 'secret path' });
      const response = await POST(
        await uploadRequest(
          new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], 'a.png', { type: 'image/png' }),
        ),
      );
      expect(response.status).toBe(409);
      expect(await response.json()).toMatchObject({ error: { code: 'ASSET_EXISTS' } });
    },
  );

  it('allows missing Origin only after successful Access verification', async () => {
    const file = () =>
      new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], 'a.png', { type: 'image/png' });
    expect((await POST(await uploadRequest(file(), null))).status).toBe(403);
    expect((await POST(await uploadRequest(file(), null, undefined, 'valid'))).status).toBe(201);
    expect(mocks.verifyAccess).toHaveBeenCalledWith('valid', {});
    mocks.storeAsset.mockClear();
    const { OwnerAuthorizationError } = await import('@lib/auth/owner');
    mocks.verifyAccess.mockRejectedValue(new OwnerAuthorizationError('인증 실패', 401));
    expect((await POST(await uploadRequest(file(), null, undefined, 'forged'))).status).toBe(401);
    expect(mocks.storeAsset).not.toHaveBeenCalled();
  });

  it('limits actual multipart bytes without Content-Length', async () => {
    const request = await uploadRequest(
      new File([new Uint8Array(12 * 1024 * 1024)], 'a.png', { type: 'image/png' }),
    );
    expect((await POST(request)).status).toBe(413);
    expect(mocks.storeAsset).not.toHaveBeenCalled();
  });

  it('stores the generated contract key and returns root-relative and public URLs', async () => {
    const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
    const response = await POST(
      await uploadRequest(new File([bytes], 'a.png', { type: 'image/png' })),
    );
    expect(response.status).toBe(201);
    expect(mocks.storeAsset).toHaveBeenCalledOnce();
    const [config, object] = mocks.storeAsset.mock.calls[0];
    expect(config).toMatchObject({ backend: 'local', root: '/srv/assets' });
    expect(object.key).toMatch(/^assets\/posts\/\d{4}-\d{2}-\d{2}\/[0-9a-f-]+\.png$/);
    expect(object.contentType).toBe('image/png');
    expect(object.body).toEqual(bytes);
    const payload = await response.json();
    expect(payload.path).toBe(`/${object.key}`);
    expect(payload.url).toBe(`/${object.key}`);
    expect(payload.publicUrl).toBe(`https://cdn-dev.raven.kr/${object.key}`);
  });
});
