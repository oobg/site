'use server';

import { redirect } from 'next/navigation';

import { ROUTES } from '@constants/routes';
import { createClient } from '@lib/supabase/server';

export async function signOutAction() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Sign out failed', { kind: error.name || 'AuthError' });
    throw new Error('로그아웃하지 못했습니다.');
  }
  redirect(ROUTES.ADMIN.HOME);
}
