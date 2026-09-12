import 'server-only';

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { link, lstat, mkdir, realpath, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { AssetStorageConfig } from '@configs/cms-env';
import { assertAssetKey } from '@lib/assets/key';

export type AssetObject = {
  key: string;
  body: Uint8Array;
  contentType: string;
};

async function ensureDirectoryWithoutSymlinks(root: string, segments: string[]) {
  const rootStat = await lstat(root);
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) throw new Error('Invalid asset root');

  let current = root;
  for (const segment of segments) {
    current = path.join(current, segment);
    try {
      const stat = await lstat(current);
      if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error('Unsafe asset directory');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      await mkdir(current).catch((mkdirError: NodeJS.ErrnoException) => {
        if (mkdirError.code !== 'EEXIST') throw mkdirError;
      });
      const stat = await lstat(current);
      if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error('Unsafe asset directory');
    }
  }
  return current;
}

export async function storeLocalAsset(root: string, object: AssetObject) {
  assertAssetKey(object.key);
  const resolvedRoot = path.resolve(root);
  // nginx `location /assets/ { alias /srv/assets/; }` removes the URL prefix.
  const parts = object.key.split('/').slice(1);
  const fileName = parts.pop()!;
  const parent = await ensureDirectoryWithoutSymlinks(resolvedRoot, parts);
  const actualRoot = await realpath(resolvedRoot);
  const actualParent = await realpath(parent);
  if (actualParent !== actualRoot && !actualParent.startsWith(`${actualRoot}${path.sep}`)) {
    throw new Error('Asset path escapes storage root');
  }

  const destination = path.join(actualParent, fileName);
  const temporary = path.join(actualParent, `.${fileName}.${crypto.randomUUID()}.tmp`);
  try {
    await writeFile(temporary, object.body, { flag: 'wx', mode: 0o644 });
    await link(temporary, destination);
  } finally {
    await unlink(temporary).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== 'ENOENT') throw error;
    });
  }
}

export async function storeAsset(config: AssetStorageConfig, object: AssetObject) {
  assertAssetKey(object.key);
  if (config.backend === 'local') {
    await storeLocalAsset(config.root, object);
    return;
  }

  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
  });
  try {
    await client.send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: object.key,
        Body: object.body,
        ContentType: object.contentType,
        CacheControl: 'public, max-age=31536000, immutable',
        IfNoneMatch: '*',
      }),
    );
  } finally {
    // 이 함수가 매 업로드마다 만든 클라이언트라 여기서 소켓도 함께 닫는다.
    client.destroy();
  }
}
