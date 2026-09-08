import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { updateSession } from '@lib/supabase/proxy';

function hasMalformedDetailPath(request: NextRequest): boolean {
  const match = new URL(request.url).pathname.match(/^\/(?:blog|projects)\/(.+)$/);
  if (!match) return false;
  try {
    const routeParam = decodeURIComponent(match[1]);
    decodeURIComponent(routeParam);
    return false;
  } catch (error) {
    if (error instanceof URIError) return true;
    throw error;
  }
}

export function proxy(request: NextRequest) {
  if (hasMalformedDetailPath(request)) return new NextResponse(null, { status: 400 });
  const path = request.nextUrl.pathname;
  if (
    path === '/blog' ||
    path.startsWith('/blog/') ||
    path === '/projects' ||
    path.startsWith('/projects/')
  ) {
    return NextResponse.next({ request });
  }
  return updateSession(request);
}

export const config = {
  matcher: ['/admin/:path*', '/auth/:path*', '/blog/:path*', '/projects/:path*'],
};
