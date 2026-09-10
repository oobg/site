'use client';

import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { deletePostAction } from '@features/admin/services/posts.actions';
import {
  initialPostActionState,
  type PostActionState,
} from '@features/admin/types/posts-admin.types';
import styles from './DeletePostButton.module.css';

export function DeletePostButton({ id }: { id: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [state, action, pending] = useActionState(
    async (previous: PostActionState, data: FormData) => {
      const result = await deletePostAction(previous, data);
      if (result.status === 'success') {
        await queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
        await queryClient.invalidateQueries({ queryKey: ['post'] });
        router.replace('/admin');
      }
      return result;
    },
    initialPostActionState,
  );
  return (
    <form
      className={styles.form}
      action={action}
      onSubmit={(event) => {
        if (!window.confirm('이 글을 삭제할까요? 삭제한 글은 복구할 수 없어요.'))
          event.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button className={styles.button} type="submit" disabled={pending}>
        {pending ? '삭제 중...' : '글 삭제'}
      </button>
      {state.message ? (
        <span role={state.status === 'error' ? 'alert' : 'status'}>{state.message}</span>
      ) : null}
    </form>
  );
}
