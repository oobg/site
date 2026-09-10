'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { PostActionState } from '@features/admin/types/posts-admin.types';
import { blogCategoryInputSchema } from '@features/posts/utils/blog-schema';
import { requireOwner, OwnerAuthorizationError } from '@lib/auth/owner';
import { invalidatePublicPostCache } from '@lib/cache/posts';
import { createClient } from '@lib/supabase/server';

const categoryIdSchema = z.string().uuid();
const pinnedIdsSchema = z
  .array(z.string().uuid())
  .max(5)
  .superRefine((ids, context) => {
    if (new Set(ids).size !== ids.length)
      context.addIssue({ code: 'custom', message: '중복된 글이 있습니다.' });
  });

const fail = (error: unknown): PostActionState => {
  if (!(error instanceof OwnerAuthorizationError)) {
    console.error('Blog settings mutation failed', {
      kind: error instanceof Error ? error.name : 'UnknownError',
    });
  }
  return {
    status: 'error',
    message:
      error instanceof OwnerAuthorizationError ? error.message : '요청을 처리하지 못했습니다.',
  };
};

function refreshAdmin() {
  try {
    invalidatePublicPostCache();
    revalidatePath('/admin');
  } catch (error) {
    console.error('Blog settings cache invalidation failed', {
      kind: error instanceof Error ? error.name : 'UnknownError',
    });
  }
}

export async function createCategoryAction(
  _state: PostActionState,
  formData: FormData,
): Promise<PostActionState> {
  const parsed = blogCategoryInputSchema.safeParse({
    slug: formData.get('slug'),
    name: formData.get('name'),
    sort_order: formData.get('sort_order'),
  });
  if (!parsed.success) return { status: 'error', message: '카테고리 입력값을 확인해 주세요.' };
  try {
    await requireOwner();
    const supabase = await createClient();
    const { error } = await supabase.from('post_categories').insert(parsed.data);
    if (error?.code === '23505') return { status: 'error', message: '이미 사용 중인 slug입니다.' };
    if (error) throw error;
    refreshAdmin();
    return { status: 'success', message: '카테고리를 추가했습니다.' };
  } catch (error) {
    return fail(error);
  }
}

export async function updateCategoryAction(
  _state: PostActionState,
  formData: FormData,
): Promise<PostActionState> {
  const id = categoryIdSchema.safeParse(formData.get('id'));
  const parsed = blogCategoryInputSchema.safeParse({
    slug: formData.get('slug'),
    name: formData.get('name'),
    sort_order: formData.get('sort_order'),
  });
  if (!id.success || !parsed.success)
    return { status: 'error', message: '카테고리 입력값을 확인해 주세요.' };
  try {
    await requireOwner();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('post_categories')
      .update(parsed.data)
      .eq('id', id.data)
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!data) return { status: 'error', message: '카테고리를 찾을 수 없습니다.' };
    refreshAdmin();
    return { status: 'success', message: '카테고리를 수정했습니다.' };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteCategoryAction(
  _state: PostActionState,
  formData: FormData,
): Promise<PostActionState> {
  const id = categoryIdSchema.safeParse(formData.get('id'));
  if (!id.success) return { status: 'error', message: '카테고리 ID가 올바르지 않습니다.' };
  try {
    await requireOwner();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('post_categories')
      .delete()
      .eq('id', id.data)
      .select('id')
      .maybeSingle();
    if (error?.code === '23514')
      return { status: 'error', message: '미분류 카테고리는 삭제할 수 없습니다.' };
    if (error) throw error;
    if (!data) return { status: 'error', message: '카테고리를 찾을 수 없습니다.' };
    refreshAdmin();
    return { status: 'success', message: '글은 미분류로 옮기고 카테고리를 삭제했습니다.' };
  } catch (error) {
    return fail(error);
  }
}

export async function reorderPinnedPostsAction(
  _state: PostActionState,
  formData: FormData,
): Promise<PostActionState> {
  const ids = pinnedIdsSchema.safeParse(formData.getAll('post_ids'));
  if (!ids.success)
    return { status: 'error', message: '공개 글은 최대 5개까지 고정할 수 있습니다.' };
  try {
    await requireOwner();
    const supabase = await createClient();
    const { error } = await supabase.rpc('set_pinned_posts', { post_ids: ids.data });
    if (error?.code === '23514')
      return { status: 'error', message: '공개 글만 최대 5개까지 고정할 수 있습니다.' };
    if (error) throw error;
    refreshAdmin();
    return { status: 'success', message: '대표 글 순서를 저장했습니다.' };
  } catch (error) {
    return fail(error);
  }
}
