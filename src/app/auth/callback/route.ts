import { type NextRequest, NextResponse } from 'next/server';

import { ROUTES } from '@constants/routes';
import { createClient } from '@lib/supabase/server';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const errorUrl = new URL(`${ROUTES.ADMIN.HOME}?error=oauth`, request.url);
  if (!code) return NextResponse.redirect(errorUrl);

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return NextResponse.redirect(errorUrl);
    return NextResponse.redirect(new URL(ROUTES.ADMIN.HOME, request.url));
  } catch {
    return NextResponse.redirect(errorUrl);
  }
}
