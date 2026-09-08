import { NextResponse } from 'next/server';

import { CmsConfigurationError, getAssetStorageConfig } from '@configs/cms-env';
import { storeAsset } from '@lib/assets/storage';
import { OwnerAuthorizationError, requireOwner } from '@lib/auth/owner';

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
    const origin = request.headers.get('origin');
    const expectedOrigin = process.env.SITE_URL?.replace(/\/$/, '') ?? new URL(request.url).origin;
    if (!origin || origin !== expectedOrigin) {
      return NextResponse.json({ error: '허용되지 않은 요청 출처입니다.' }, { status: 403 });
    }

    await requireOwner();
    const declaredLength = Number(request.headers.get('content-length'));
    if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_SIZE)
      return NextResponse.json({ error: '요청 본문이 너무 큽니다.' }, { status: 413 });

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json({ error: '요청 형식이 올바르지 않습니다.' }, { status: 400 });
    }
    const file = formData.get('file');
    if (!(file instanceof File))
      return NextResponse.json({ error: '이미지 파일이 필요합니다.' }, { status: 400 });
    if (file.size === 0 || file.size > MAX_FILE_SIZE)
      return NextResponse.json({ error: '이미지는 10MB 이하여야 합니다.' }, { status: 400 });

    const imageType = imageTypes[file.type as keyof typeof imageTypes];
    if (!imageType)
      return NextResponse.json(
        { error: 'JPEG, PNG, GIF, WebP 이미지만 업로드할 수 있습니다.' },
        { status: 415 },
      );
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!imageType.matches(bytes))
      return NextResponse.json(
        { error: '파일 내용이 이미지 형식과 일치하지 않습니다.' },
        { status: 415 },
      );

    const config = getAssetStorageConfig();
    const date = new Date().toISOString().slice(0, 10);
    const path = `assets/posts/${date}/${crypto.randomUUID()}.${imageType.extension}`;
    await storeAsset(config, { key: path, body: bytes, contentType: file.type });

    const markdownPath = `/${path}`;
    return NextResponse.json(
      { path: markdownPath, url: markdownPath, publicUrl: `${config.publicUrl}/${path}` },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof OwnerAuthorizationError)
      return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof CmsConfigurationError)
      return NextResponse.json({ error: error.message }, { status: 503 });
    console.error('Asset upload failed', {
      kind: error instanceof Error ? error.name : 'UnknownError',
    });
    return NextResponse.json({ error: '이미지를 업로드하지 못했습니다.' }, { status: 500 });
  }
}
