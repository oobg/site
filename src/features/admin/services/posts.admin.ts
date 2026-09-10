import 'server-only';

import { unstable_noStore as noStore } from 'next/cache';

import type { AdminPost } from '@/features/admin/types/posts-admin.types';
import type { BlogCategory } from '@features/posts/types/posts.types';
import { requireOwner } from '@lib/auth/owner';
import { createClient } from '@lib/supabase/server';

const listColumns = 'id,title,slug,status,updated_at,pin_order,category_id';
const detailColumns =
  'id,title,slug,description,body,status,published_at,created_at,updated_at,category_id,tags,cover_image_key,cover_image_url,cover_position_x,cover_position_y,cover_alt,pin_order';
export type AdminPostSummary = Pick<
  AdminPost,
  'id' | 'title' | 'slug' | 'status' | 'updated_at' | 'pin_order'
> & { category_id?: string | null };

export async function listAdminPosts(): Promise<AdminPostSummary[]> {
  noStore();
  await requireOwner();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('posts')
    .select(listColumns)
    .order('updated_at', { ascending: false });

  if (error) throw new Error(`글 목록을 불러오지 못했습니다: ${error.message}`);
  return (data ?? []) as AdminPostSummary[];
}

export async function getAdminPost(id: string): Promise<AdminPost | null> {
  noStore();
  await requireOwner();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('posts')
    .select(detailColumns)
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(`글을 불러오지 못했습니다: ${error.message}`);
  return data as AdminPost | null;
}

export async function listAdminCategories(): Promise<BlogCategory[]> {
  noStore();
  await requireOwner();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('post_categories')
    .select('id,slug,name,sort_order,is_default')
    .order('sort_order', { ascending: true })
    .order('slug', { ascending: true });
  if (error) throw new Error(`카테고리를 불러오지 못했습니다: ${error.message}`);
  return (data ?? []) as BlogCategory[];
}
