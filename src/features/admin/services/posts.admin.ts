import 'server-only';

import { unstable_noStore as noStore } from 'next/cache';

import type { AdminPost } from '@/features/admin/types/posts-admin.types';
import { requireOwner } from '@lib/auth/owner';
import { createClient } from '@lib/supabase/server';

const columns =
  'id,title,slug,description,body,status,published_at,created_at,updated_at,cover_image_url';

export async function listAdminPosts(): Promise<AdminPost[]> {
  noStore();
  await requireOwner();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('posts')
    .select(columns)
    .order('updated_at', { ascending: false });

  if (error) throw new Error(`글 목록을 불러오지 못했습니다: ${error.message}`);
  return data as AdminPost[];
}

export async function getAdminPost(id: string): Promise<AdminPost | null> {
  noStore();
  await requireOwner();
  const supabase = await createClient();
  const { data, error } = await supabase.from('posts').select(columns).eq('id', id).maybeSingle();

  if (error) throw new Error(`글을 불러오지 못했습니다: ${error.message}`);
  return data as AdminPost | null;
}
