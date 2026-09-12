import { getAssetStorageConfig } from '@configs/cms-env';
import { storeAsset } from '@lib/assets/storage';
import { isAssetKey } from '@lib/assets/key';
import { requireAdminApiAccess } from '@lib/auth/admin-api';
import { AdminApiError, adminError, adminJson, readLimitedBody } from '@lib/api/admin-http';

export const runtime = 'nodejs';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_REQUEST_SIZE = MAX_FILE_SIZE + 1024 * 1024;
const imageTypes = {
  'image/jpeg': {
    extension: 'jpg',
    matches: (b: Uint8Array) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  'image/png': {
    extension: 'png',
    matches: (b: Uint8Array) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  },
  'image/gif': {
    extension: 'gif',
    matches: (b: Uint8Array) =>
      String.fromCharCode(...b.slice(0, 6)) === 'GIF87a' ||
      String.fromCharCode(...b.slice(0, 6)) === 'GIF89a',
  },
  'image/webp': {
    extension: 'webp',
    matches: (b: Uint8Array) =>
      String.fromCharCode(...b.slice(0, 4)) === 'RIFF' &&
      String.fromCharCode(...b.slice(8, 12)) === 'WEBP',
  },
} as const;

export async function POST(request: Request) {
  try {
    await requireAdminApiAccess(request);
    const body = await readLimitedBody(request, MAX_REQUEST_SIZE);

    let formData: FormData;
    try {
      formData = await new Response(body, {
        headers: { 'content-type': request.headers.get('content-type') ?? '' },
      }).formData();
    } catch {
      throw new AdminApiError(400, 'INVALID_MULTIPART', '요청 형식이 올바르지 않습니다.');
    }
    const file = formData.get('file');
    if (!file || typeof file === 'string')
      throw new AdminApiError(400, 'FILE_REQUIRED', '이미지 파일이 필요합니다.');
    if (file.size === 0 || file.size > MAX_FILE_SIZE)
      throw new AdminApiError(400, 'INVALID_FILE_SIZE', '이미지는 10MB 이하여야 합니다.');

    const imageType = imageTypes[file.type as keyof typeof imageTypes];
    if (!imageType)
      throw new AdminApiError(
        415,
        'UNSUPPORTED_IMAGE',
        'JPEG, PNG, GIF, WebP 이미지만 업로드할 수 있습니다.',
      );
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!imageType.matches(bytes))
      throw new AdminApiError(415, 'INVALID_IMAGE', '파일 내용이 이미지 형식과 일치하지 않습니다.');

    const config = getAssetStorageConfig();
    const date = new Date().toISOString().slice(0, 10);
    const explicitKey = formData.get('key');
    if (
      explicitKey !== null &&
      (typeof explicitKey !== 'string' ||
        !isAssetKey(explicitKey) ||
        !explicitKey.endsWith(`.${imageType.extension}`))
    )
      throw new AdminApiError(
        422,
        'INVALID_ASSET_KEY',
        '이미지 키 또는 확장자가 올바르지 않습니다.',
      );
    const path =
      (explicitKey as string | null) ??
      `assets/posts/${date}/${crypto.randomUUID()}.${imageType.extension}`;
    await storeAsset(config, { key: path, body: bytes, contentType: file.type });

    const markdownPath = `/${path}`;
    return adminJson(
      { path: markdownPath, url: markdownPath, publicUrl: `${config.publicUrl}/${path}` },
      201,
    );
  } catch (error) {
    const storageError = error as {
      code?: string;
      name?: string;
      $metadata?: { httpStatusCode?: number };
    } | null;
    if (
      storageError?.code === 'EEXIST' ||
      storageError?.name === 'PreconditionFailed' ||
      [409, 412].includes(storageError?.$metadata?.httpStatusCode ?? 0)
    )
      return adminError(
        new AdminApiError(409, 'ASSET_EXISTS', '같은 키의 이미지가 이미 있습니다.'),
      );
    return adminError(error);
  }
}
