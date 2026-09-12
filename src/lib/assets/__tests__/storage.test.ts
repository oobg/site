import { mkdtemp, mkdir, readFile, symlink } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { storeLocalAsset } from '@lib/assets/storage';
import { isAssetKey } from '@lib/assets/key';

const roots: string[] = [];

afterEach(async () => {
  const { rm } = await import('node:fs/promises');
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

async function assetRoot() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'raven-assets-'));
  roots.push(root);
  return root;
}

const object = {
  key: 'assets/posts/2026-09-07/123e4567-e89b-12d3-a456-426614174000.png',
  body: new Uint8Array([0x89, 0x50, 0x4e, 0x47]),
  contentType: 'image/png',
};

describe('local asset storage', () => {
  it('preserves descriptive filenames and rejects unsafe keys', async () => {
    const root = await assetRoot();
    const key = 'assets/posts/2026-09-10/design-system-00-v2.png';
    await storeLocalAsset(root, { ...object, key });
    expect(await readFile(path.join(root, key.slice('assets/'.length)))).toEqual(
      Buffer.from(object.body),
    );
    for (const invalid of [
      '/assets/posts/2026-09-10/a.png',
      'assets/posts/2026-09-10/../a.png',
      'assets/posts/2026-09-10/%2e%2e.png',
      'assets/posts/2026-09-10/a.svg',
      'assets/posts/2026-02-30/a.png',
      'assets/posts/2026-09-10/a.png.exe',
      'https://cdn.example/a.png',
    ]) {
      expect(isAssetKey(invalid)).toBe(false);
    }
  });
  it('maps /assets/posts URLs to the nginx alias root without a duplicate assets segment', async () => {
    const root = await assetRoot();
    await storeLocalAsset(root, object);

    await expect(
      readFile(path.join(root, 'posts/2026-09-07/123e4567-e89b-12d3-a456-426614174000.png')),
    ).resolves.toEqual(Buffer.from(object.body));
    await expect(readFile(path.join(root, object.key))).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('does not overwrite an existing object key', async () => {
    const root = await assetRoot();
    await storeLocalAsset(root, object);
    await expect(
      storeLocalAsset(root, { ...object, body: new Uint8Array([1, 2, 3]) }),
    ).rejects.toMatchObject({ code: 'EEXIST' });
    await expect(
      readFile(path.join(root, 'posts/2026-09-07/123e4567-e89b-12d3-a456-426614174000.png')),
    ).resolves.toEqual(Buffer.from(object.body));
  });

  it('allows concurrent first uploads to create the same date directory', async () => {
    const root = await assetRoot();
    const second = {
      ...object,
      key: 'assets/posts/2026-09-07/223e4567-e89b-12d3-a456-426614174000.png',
    };
    await Promise.all([storeLocalAsset(root, object), storeLocalAsset(root, second)]);
    await expect(
      readFile(path.join(root, 'posts/2026-09-07', object.key.split('/').at(-1)!)),
    ).resolves.toEqual(Buffer.from(object.body));
    await expect(
      readFile(path.join(root, 'posts/2026-09-07', second.key.split('/').at(-1)!)),
    ).resolves.toEqual(Buffer.from(second.body));
  });

  it('rejects keys outside the upload contract', async () => {
    const root = await assetRoot();
    await expect(
      storeLocalAsset(root, { ...object, key: 'assets/posts/../escape.png' }),
    ).rejects.toThrow('Invalid asset key');
  });

  it('rejects a symlink in the storage parent chain', async () => {
    const root = await assetRoot();
    const outside = await assetRoot();
    await mkdir(path.join(root, 'posts'));
    await symlink(outside, path.join(root, 'posts/2026-09-07'));
    await expect(storeLocalAsset(root, object)).rejects.toThrow('Unsafe asset directory');
  });
});
