'use client';

import { useActionState, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { BlogCategory } from '@features/posts/types/posts.types';
import type { AdminPostSummary } from '@features/admin/services/posts.admin';
import type { PostActionState } from '@features/admin/types/posts-admin.types';
import { initialPostActionState } from '@features/admin/types/posts-admin.types';
import {
  createCategoryAction,
  deleteCategoryAction,
  reorderPinnedPostsAction,
  updateCategoryAction,
} from '@features/admin/services/categories.actions';
import styles from './BlogSettings.module.css';

function CategoryRow({ category }: { category: BlogCategory }) {
  const queryClient = useQueryClient();
  const withInvalidation =
    (action: typeof updateCategoryAction) => async (state: PostActionState, data: FormData) => {
      const result = await action(state, data);
      if (result.status === 'success') {
        await queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
        await queryClient.invalidateQueries({ queryKey: ['post'] });
      }
      return result;
    };
  const [updateState, updateAction, updating] = useActionState(
    withInvalidation(updateCategoryAction),
    initialPostActionState,
  );
  const [deleteState, deleteAction, deleting] = useActionState(
    withInvalidation(deleteCategoryAction),
    initialPostActionState,
  );
  const state = deleteState.status !== 'idle' ? deleteState : updateState;
  return (
    <div className={styles.row}>
      <form action={updateAction} className={styles.categoryForm}>
        <input type="hidden" name="id" value={category.id} />
        <input
          name="name"
          defaultValue={category.name}
          aria-label="카테고리 이름"
          disabled={category.is_default}
        />
        <input
          name="slug"
          defaultValue={category.slug}
          aria-label="카테고리 slug"
          disabled={category.is_default}
        />
        <input
          name="sort_order"
          type="number"
          min="0"
          defaultValue={category.sort_order}
          aria-label="정렬 순서"
        />
        <button type="submit" disabled={updating || category.is_default}>
          저장
        </button>
      </form>
      <form
        action={deleteAction}
        onSubmit={(event) => {
          if (!window.confirm('이 카테고리의 글을 미분류로 옮기고 삭제할까요?'))
            event.preventDefault();
        }}
      >
        <input type="hidden" name="id" value={category.id} />
        <button type="submit" disabled={deleting || category.is_default}>
          삭제
        </button>
      </form>
      {!category.is_default ? <small>삭제하면 이 카테고리의 글은 미분류로 옮겨져요.</small> : null}
      {state.message ? (
        <p role={state.status === 'error' ? 'alert' : 'status'}>{state.message}</p>
      ) : null}
    </div>
  );
}

export function BlogSettings({
  categories,
  posts,
}: {
  categories: BlogCategory[];
  posts: AdminPostSummary[];
}) {
  const queryClient = useQueryClient();
  const [createState, createAction, creating] = useActionState(
    async (state: PostActionState, data: FormData) => {
      const result = await createCategoryAction(state, data);
      if (result.status === 'success') {
        await queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
        await queryClient.invalidateQueries({ queryKey: ['post'] });
      }
      return result;
    },
    initialPostActionState,
  );
  const published = posts.filter((post) => post.status === 'published');
  const [pinnedIds, setPinnedIds] = useState(
    published
      .filter((post) => post.pin_order !== null)
      .sort((a, b) => (a.pin_order ?? 99) - (b.pin_order ?? 99))
      .map((post) => post.id),
  );
  const [pinState, pinAction, pinning] = useActionState(
    async (state: PostActionState, data: FormData) => {
      const result = await reorderPinnedPostsAction(state, data);
      if (result.status === 'success')
        await queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      return result;
    },
    initialPostActionState,
  );

  const toggle = (id: string) => {
    setPinnedIds((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : current.length < 5
          ? [...current, id]
          : current,
    );
  };
  const move = (id: string, offset: number) => {
    setPinnedIds((current) => {
      const from = current.indexOf(id);
      const to = from + offset;
      if (from < 0 || to < 0 || to >= current.length) return current;
      const next = [...current];
      [next[from], next[to]] = [next[to], next[from]];
      return next;
    });
  };
  const orderedPosts = [
    ...pinnedIds
      .map((id) => published.find((post) => post.id === id))
      .filter((post): post is AdminPostSummary => Boolean(post)),
    ...published.filter((post) => !pinnedIds.includes(post.id)),
  ];

  return (
    <div className={styles.settings}>
      <section>
        <h2>카테고리</h2>
        {categories.map((category) => (
          <CategoryRow key={category.id} category={category} />
        ))}
        <form action={createAction} className={styles.categoryForm}>
          <input name="name" placeholder="새 카테고리" aria-label="새 카테고리 이름" required />
          <input name="slug" placeholder="category-slug" aria-label="새 카테고리 slug" required />
          <input name="sort_order" type="number" min="0" defaultValue="0" aria-label="정렬 순서" />
          <button type="submit" disabled={creating}>
            추가
          </button>
        </form>
        {createState.message ? (
          <p role={createState.status === 'error' ? 'alert' : 'status'}>{createState.message}</p>
        ) : null}
      </section>

      <section>
        <h2>대표 글</h2>
        <p>공개 글을 최대 5개 선택하고 화살표로 순서를 정해요.</p>
        <form action={pinAction}>
          {published.length === 0 ? (
            <p>고정할 공개 글이 없어요.</p>
          ) : (
            orderedPosts.map((post) => {
              const checked = pinnedIds.includes(post.id);
              const index = pinnedIds.indexOf(post.id);
              return (
                <div className={styles.postRow} key={post.id}>
                  <label>
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={pinning || (!checked && pinnedIds.length >= 5)}
                      onChange={() => toggle(post.id)}
                    />
                    {checked ? `${index + 1}. ` : ''}
                    {post.title}
                  </label>
                  <button
                    type="button"
                    aria-label={`${post.title} 위로`}
                    disabled={pinning || !checked || index === 0}
                    onClick={() => move(post.id, -1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label={`${post.title} 아래로`}
                    disabled={pinning || !checked || index === pinnedIds.length - 1}
                    onClick={() => move(post.id, 1)}
                  >
                    ↓
                  </button>
                </div>
              );
            })
          )}
          {pinnedIds.map((id) => (
            <input key={id} type="hidden" name="post_ids" value={id} />
          ))}
          <button type="submit" disabled={pinning || published.length === 0}>
            대표 순서 저장
          </button>
        </form>
        {pinState.message ? (
          <p role={pinState.status === 'error' ? 'alert' : 'status'}>{pinState.message}</p>
        ) : null}
      </section>
    </div>
  );
}
