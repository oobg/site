'use client';

import { useActionState, useState } from 'react';
import { Dialog } from '@components/ui/Dialog';
import { Button } from '@components/ui/Button';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@constants/routes';
import { useQueryClient } from '@tanstack/react-query';
import { deletePostAction } from '@features/admin/services/posts.actions';
import {
  initialPostActionState,
  type PostActionState,
} from '@features/admin/types/posts-admin.types';
import styles from './DeletePostButton.module.css';

export function DeletePostButton({ id, title = '제목 없는 글' }: { id: string; title?: string }) {
  const [open, setOpen] = useState(false);
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
      <Dialog
        trigger="글 삭제"
        triggerVariant="danger"
        title="글을 영구 삭제할까요?"
        description={`‘${title}’ 글이 목록에서 사라집니다. 삭제한 글은 복구할 수 없어요.`}
        open={open}
        onOpenChange={(next) => {
          if (!pending) setOpen(next);
        }}
      >
        <form action={action} aria-busy={pending} onSubmit={(event) => event.stopPropagation()}>
          <input type="hidden" name="id" value={id} />
          {state.message ? (
            <p role={state.status === 'error' ? 'alert' : 'status'}>{state.message}</p>
          ) : null}
          <div className={styles.actions}>
            <Button disabled={pending} onClick={() => setOpen(false)}>
              취소
            </Button>
            <Button variant="danger" type="submit" disabled={pending}>
              {pending ? '삭제 중...' : '영구 삭제'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
