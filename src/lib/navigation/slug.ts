import 'server-only';
import { notFound } from 'next/navigation';
import { isSafeRouteSlug } from '@lib/navigation/route-segment';

/** 라우트 세그먼트를 기존 NFC 키 형식으로 맞추고 잘못된 percent 인코딩은 404로 보낸다. */
export function normalizeRouteSlug(slug: string): string {
  try {
    const normalized = decodeURIComponent(slug).normalize('NFC');
    if (!isSafeRouteSlug(normalized)) notFound();
    return normalized;
  } catch (error) {
    if (error instanceof URIError) notFound();
    throw error;
  }
}
