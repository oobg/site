'use server';

import { revalidatePath } from 'next/cache';

import type { PostActionState } from '@/features/admin/types/posts-admin.types';
import { postIdSchema, postInputSchema } from '@/features/admin/services/posts.schema';
import { ROUTES } from '@constants/routes';
import { OwnerAuthorizationError, requireOwner } from '@lib/auth/owner';
import { createClient } from '@lib/supabase/server';

const valuesFrom = (formData: FormData) => ({
  title: formData.get('title'),
  slug: formData.get('slug'),
  description: formData.get('description'),
  body: formData.get('body'),
  status: formData.get('status'),
});

const failure = (error: unknown): PostActionState => ({
  status: 'error',
  message: error instanceof OwnerAuthorizationError ? error.message : '요청을 처리하지 못했습니다.',
});

function refreshPostPaths(slug?: string) {
  revalidatePath(ROUTES.HOME);
  revalidatePath(ROUTES.BLOG.LIST);
  revalidatePath(ROUTES.ADMIN.HOME);
  if (slug) revalidatePath(ROUTES.BLOG.DETAIL(slug));
}

export async function createPostAction(
  _previousState: PostActionState,
  formData: FormData,
): Promise<PostActionState> {
  const parsed = postInputSchema.safeParse(valuesFrom(formData));
  if (!parsed.success) {
    return {
      status: 'error',
      message: '입력값을 확인해 주세요.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await requireOwner();
    const supabase = await createClient();
    const publishedAt = parsed.data.status === 'published' ? new Date().toISOString() : null;
    const { data, error } = await supabase
      .from('posts')
      .insert({ ...parsed.data, published_at: publishedAt })
      .select('id')
      .single();
    if (error?.code === '23505') {
      return {
        status: 'error',
        message: '이미 사용 중인 슬러그입니다.',
        fieldErrors: { slug: ['이미 사용 중인 슬러그입니다.'] },
      };
    }
    if (error) throw error;
    refreshPostPaths(parsed.data.slug);
    return { status: 'success', message: '글을 저장했습니다.', postId: data.id };
  } catch (error) {
    if (!(error instanceof OwnerAuthorizationError)) console.error('Create post failed', error);
    return failure(error);
  }
}

export async function updatePostAction(
  _previousState: PostActionState,
  formData: FormData,
): Promise<PostActionState> {
  const id = postIdSchema.safeParse(formData.get('id'));
  const parsed = postInputSchema.safeParse(valuesFrom(formData));
  if (!id.success || !parsed.success) {
    return {
      status: 'error',
      message: '입력값을 확인해 주세요.',
      fieldErrors: parsed.success ? undefined : parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await requireOwner();
    const supabase = await createClient();
    const { data: current, error: readError } = await supabase
      .from('posts')
      .select('slug,status,published_at')
      .eq('id', id.data)
      .single();
    if (readError) throw readError;
    const publishedAt =
      parsed.data.status === 'published'
        ? (current.published_at ?? new Date().toISOString())
        : null;
    const { error } = await supabase
      .from('posts')
      .update({ ...parsed.data, published_at: publishedAt })
      .eq('id', id.data);
    if (error?.code === '23505') {
      return {
        status: 'error',
        message: '이미 사용 중인 슬러그입니다.',
        fieldErrors: { slug: ['이미 사용 중인 슬러그입니다.'] },
      };
    }
    if (error) throw error;
    refreshPostPaths(current.slug);
    refreshPostPaths(parsed.data.slug);
    return { status: 'success', message: '글을 수정했습니다.' };
  } catch (error) {
    if (!(error instanceof OwnerAuthorizationError)) console.error('Update post failed', error);
    return failure(error);
  }
}

export async function updatePostStatusAction(
  idValue: string,
  statusValue: string,
): Promise<PostActionState> {
  const id = postIdSchema.safeParse(idValue);
  const status = postInputSchema.shape.status.safeParse(statusValue);
  if (!id.success || !status.success)
    return { status: 'error', message: '올바르지 않은 상태입니다.' };
  try {
    await requireOwner();
    const supabase = await createClient();
    const { data: current, error: readError } = await supabase
      .from('posts')
      .select('title,slug,description,body,status,published_at')
      .eq('id', id.data)
      .single();
    if (readError) throw readError;
    const validated = postInputSchema.safeParse({ ...current, status: status.data });
    if (status.data === 'published' && !validated.success)
      return {
        status: 'error',
        message: '필수 내용을 채운 뒤 공개해 주세요.',
        fieldErrors: validated.error.flatten().fieldErrors,
      };
    const publishedAt =
      status.data === 'published' ? (current.published_at ?? new Date().toISOString()) : null;
    const updatedAt = new Date().toISOString();
    const { error } = await supabase
      .from('posts')
      .update({ status: status.data, published_at: publishedAt, updated_at: updatedAt })
      .eq('id', id.data);
    if (error) throw error;
    refreshPostPaths(current.slug);
    return {
      status: 'success',
      message: status.data === 'published' ? '글을 공개했어요.' : '글을 초안으로 바꿨어요.',
      updatedAt,
    };
  } catch (error) {
    if (!(error instanceof OwnerAuthorizationError)) console.error('Update post status failed');
    return failure(error);
  }
}

export async function deletePostAction(
  _previousState: PostActionState,
  formData: FormData,
): Promise<PostActionState> {
  const id = postIdSchema.safeParse(formData.get('id'));
  if (!id.success) return { status: 'error', message: '올바르지 않은 글 ID입니다.' };

  try {
    await requireOwner();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id.data)
      .select('slug')
      .single();
    if (error) throw error;
    refreshPostPaths(data.slug);
    return { status: 'success', message: '글을 삭제했습니다.' };
  } catch (error) {
    if (!(error instanceof OwnerAuthorizationError)) console.error('Delete post failed', error);
    return failure(error);
  }
}
