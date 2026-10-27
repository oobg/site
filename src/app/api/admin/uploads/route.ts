import { getAssetStorageConfig } from '@configs/cms-env';
import { storeAsset } from '@lib/assets/storage';
import { isEmbedAssetKey, isImageAssetKey } from '@lib/assets/key';
import { requireAdminApiAccess } from '@lib/auth/admin-api';
import { AdminApiError, adminError, adminJson, readLimitedBody } from '@lib/api/admin-http';

export const runtime = 'nodejs';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_REQUEST_SIZE = MAX_FILE_SIZE + 1024 * 1024;
const imageAsset = { directory: 'posts', isKey: isImageAssetKey, label: '이미지' } as const;
const embedAsset = { directory: 'embeds', isKey: isEmbedAssetKey, label: 'HTML' } as const;

/** HTML은 매직 바이트가 없어 앞 1024바이트의 UTF-8과 문서 시작만 확인한다.
    전체 문서의 인코딩이나 내용을 검증하지 않으며, 실행 격리는 iframe과 CDN CSP가 맡는다. */
function looksLikeHtmlDocument(bytes: Uint8Array) {
  // 앞부분만 자르므로 끝에서 잘린 멀티바이트 문자 하나는 대체 문자로 남을 수 있다.
  const text = new TextDecoder('utf-8').decode(bytes.slice(0, 1024));
  if (text.slice(0, -1).includes('\uFFFD')) return false;
  const head = text
    .replace(/^\uFEFF/, '')
    .trimStart()
    .toLowerCase();
  return head.startsWith('<!doctype html') || head.startsWith('<html');
}

const assetTypes = {
  'image/jpeg': {
    ...imageAsset,
    extension: 'jpg',
    matches: (b: Uint8Array) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  'image/png': {
    ...imageAsset,
    extension: 'png',
    matches: (b: Uint8Array) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  },
  'image/gif': {
    ...imageAsset,
    extension: 'gif',
    matches: (b: Uint8Array) =>
      String.fromCharCode(...b.slice(0, 6)) === 'GIF87a' ||
      String.fromCharCode(...b.slice(0, 6)) === 'GIF89a',
  },
  'image/webp': {
    ...imageAsset,
    extension: 'webp',
    matches: (b: Uint8Array) =>
      String.fromCharCode(...b.slice(0, 4)) === 'RIFF' &&
      String.fromCharCode(...b.slice(8, 12)) === 'WEBP',
  },
  'text/html': {
    ...embedAsset,
    extension: 'html',
    matches: looksLikeHtmlDocument,
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
      throw new AdminApiError(400, 'FILE_REQUIRED', '업로드할 파일이 필요합니다.');
    if (file.size === 0 || file.size > MAX_FILE_SIZE)
      throw new AdminApiError(400, 'INVALID_FILE_SIZE', '파일은 10MB 이하여야 합니다.');

    const assetType = assetTypes[file.type as keyof typeof assetTypes];
    if (!assetType)
      throw new AdminApiError(
        415,
        'UNSUPPORTED_IMAGE',
        'JPEG, PNG, GIF, WebP 이미지나 HTML 파일만 업로드할 수 있습니다.',
      );
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!assetType.matches(bytes))
      throw new AdminApiError(
        415,
        'INVALID_IMAGE',
        `파일 내용이 ${assetType.label} 형식과 일치하지 않습니다.`,
      );

    const config = getAssetStorageConfig();
    const date = new Date().toISOString().slice(0, 10);
    const explicitKey = formData.get('key');
    const overwriteValue = formData.get('overwrite');
    if (
      overwriteValue !== null &&
      (typeof overwriteValue !== 'string' || !['true', 'false'].includes(overwriteValue))
    )
      throw new AdminApiError(422, 'INVALID_OVERWRITE', 'overwrite는 true 또는 false여야 합니다.');
    const overwrite = overwriteValue === 'true';
    if (
      explicitKey !== null &&
      (typeof explicitKey !== 'string' ||
        !assetType.isKey(explicitKey) ||
        !explicitKey.endsWith(`.${assetType.extension}`))
    )
      throw new AdminApiError(422, 'INVALID_ASSET_KEY', '파일 키 또는 확장자가 올바르지 않습니다.');
    if (overwrite && explicitKey === null)
      throw new AdminApiError(
        422,
        'OVERWRITE_KEY_REQUIRED',
        '덮어쓰려면 명시적인 파일 키가 필요합니다.',
      );
    const path =
      (explicitKey as string | null) ??
      `assets/${assetType.directory}/${date}/${crypto.randomUUID()}.${assetType.extension}`;
    const result = await storeAsset(
      config,
      { key: path, body: bytes, contentType: file.type },
      { overwrite },
    );

    const markdownPath = `/${path}`;
    return adminJson(
      {
        path: markdownPath,
        url: markdownPath,
        publicUrl: `${config.publicUrl}/${path}`,
        replaced: result?.replaced === true,
      },
      result?.replaced === true ? 200 : 201,
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
      return adminError(new AdminApiError(409, 'ASSET_EXISTS', '같은 키의 파일이 이미 있습니다.'));
    return adminError(error);
  }
}
