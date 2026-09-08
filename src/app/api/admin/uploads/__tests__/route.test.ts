import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireOwner: vi.fn(),
  getAssetStorageConfig: vi.fn(),
  storeAsset: vi.fn(),
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

import { POST } from '@/app/api/admin/uploads/route';

function uploadRequest(file: File, origin = 'https://dev.raven.kr') {
  const form = new FormData();
  form.set('file', file);
  return {
    url: 'https://dev.raven.kr/api/admin/uploads',
    headers: new Headers({ origin }),
    formData: async () => form,
  } as Request;
}

describe('POST /api/admin/uploads', () => {
  beforeEach(() => {
    mocks.requireOwner.mockReset();
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
    vi.clearAllMocks();
    delete process.env.SITE_URL;
  });

  it('rejects a different origin before owner authorization', async () => {
    const response = await POST(
      uploadRequest(
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
      uploadRequest(
        new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], 'a.png', { type: 'image/png' }),
      ),
    );
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: '로그인이 필요합니다.' });
  });

  it('rejects unsupported MIME types and mismatched image signatures', async () => {
    const unsupported = await POST(
      uploadRequest(new File(['text'], 'a.txt', { type: 'text/plain' })),
    );
    expect(unsupported.status).toBe(415);

    const mismatch = await POST(
      uploadRequest(new File(['not-png'], 'a.png', { type: 'image/png' })),
    );
    expect(mismatch.status).toBe(415);
    expect(mocks.storeAsset).not.toHaveBeenCalled();
  });

  it('keeps the 10MB upload limit', async () => {
    const response = await POST(
      uploadRequest(
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

  it('stores the generated contract key and returns root-relative and public URLs', async () => {
    const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
    const response = await POST(uploadRequest(new File([bytes], 'a.png', { type: 'image/png' })));
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
