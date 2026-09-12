import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  send: vi.fn(),
  destroy: vi.fn(),
}));

vi.mock('@aws-sdk/client-s3', () => ({
  HeadObjectCommand: class HeadObjectCommand {
    input: unknown;
    constructor(input: unknown) {
      this.input = input;
    }
  },
  PutObjectCommand: class PutObjectCommand {
    input: unknown;
    constructor(input: unknown) {
      this.input = input;
    }
  },
  S3Client: class S3Client {
    send = mocks.send;
    destroy = mocks.destroy;
    constructor(options: unknown) {
      void options;
    }
  },
}));

import { storeAsset } from '@lib/assets/storage';

const config = {
  backend: 'r2' as const,
  accountId: 'account',
  accessKeyId: 'access',
  secretAccessKey: 'secret',
  bucket: 'bucket',
  publicUrl: 'https://cdn.raven.kr',
};
const object = {
  key: 'assets/posts/2026-09-10/design-system-00-v2.png',
  body: new Uint8Array([0x89, 0x50, 0x4e, 0x47]),
  contentType: 'image/png',
};

describe('R2 asset storage conditions', () => {
  beforeEach(() => {
    mocks.send.mockReset().mockResolvedValue({});
    mocks.destroy.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('keeps IfNoneMatch=* for the default create-only upload', async () => {
    await expect(storeAsset(config, object)).resolves.toEqual({ replaced: false });
    const put = mocks.send.mock.calls[0][0] as { input: Record<string, unknown> };
    expect(put.input).toMatchObject({ IfNoneMatch: '*' });
    expect(mocks.send).toHaveBeenCalledOnce();
  });

  it('omits IfNoneMatch only for an explicit replacement', async () => {
    await expect(storeAsset(config, object, { overwrite: true })).resolves.toEqual({
      replaced: true,
    });
    const put = mocks.send.mock.calls[1][0] as { input: Record<string, unknown> };
    expect(put.input).not.toHaveProperty('IfNoneMatch');
    expect(mocks.send).toHaveBeenCalledTimes(2);
  });

  it('reports a replacement request as a new upload when the key was absent', async () => {
    mocks.send
      .mockReset()
      .mockRejectedValueOnce({ $metadata: { httpStatusCode: 404 } })
      .mockResolvedValueOnce({});
    await expect(storeAsset(config, object, { overwrite: true })).resolves.toEqual({
      replaced: false,
    });
    const put = mocks.send.mock.calls[1][0] as { input: Record<string, unknown> };
    expect(put.input).not.toHaveProperty('IfNoneMatch');
  });
});
