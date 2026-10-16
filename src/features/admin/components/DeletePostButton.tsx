'use client';

import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@constants/routes';
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
      let result: PostActionState;
      try {
        result = await deletePostAction(previous, data);
      } catch {
        return { status: 'error' as const, message: '글을 삭제하지 못했어요.' };
      }
      if (result.status === 'success') {
        try {
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['blog-posts'] }),
            queryClient.invalidateQueries({ queryKey: ['post'] }),
          ]);
        } catch {
          // The post was deleted; cache refresh failure must not prevent leaving the editor.
        }
        router.replace(ROUTES.ADMIN.HOME);
      }
      return result;
    },
    initialPostActionState,
  );
  return (
    <div className={styles.form}>
      <input type="hidden" name="id" value={id} />
      <button
        className={styles.button}
        type="submit"
        formAction={action}
        formNoValidate
        disabled={pending}
        onClick={(event) => {
          if (!window.confirm('이 글을 삭제할까요? 삭제한 글은 복구할 수 없어요.'))
            event.preventDefault();
        }}
      >
        {pending ? '삭제 중...' : '글 삭제'}
      </button>
      {state.message ? (
        <span role={state.status === 'error' ? 'alert' : 'status'}>{state.message}</span>
      ) : null}
    </div>
  );
}
