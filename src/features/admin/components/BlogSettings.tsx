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

function formatPostDate(value?: string) {
  if (!value) return '날짜 없음';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '날짜 없음'
    : new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' }).format(date);
}

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
  const [postQuery, setPostQuery] = useState('');
  const [postCategory, setPostCategory] = useState('');
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
  const orderedPosts = [...published].sort(
    (a, b) =>
      new Date(b.created_at ?? b.updated_at).getTime() -
      new Date(a.created_at ?? a.updated_at).getTime(),
  );
  const visiblePosts = orderedPosts.filter(
    (post) =>
      (!postQuery.trim() ||
        post.title.toLocaleLowerCase('ko').includes(postQuery.trim().toLocaleLowerCase('ko'))) &&
      (!postCategory || post.category_id === postCategory),
  );

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
        <div className={styles.postFilters}>
          <label>
            <span className={styles.visuallyHidden}>대표 글 검색</span>
            <input
              type="search"
              aria-label="대표 글 검색"
              placeholder="제목 검색"
              value={postQuery}
              onChange={(event) => setPostQuery(event.target.value)}
            />
          </label>
          <label>
            <span className={styles.visuallyHidden}>대표 글 카테고리</span>
            <select
              aria-label="대표 글 카테고리"
              value={postCategory}
              onChange={(event) => setPostCategory(event.target.value)}
            >
              <option value="">모든 카테고리</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className={styles.postTableHeader} aria-hidden>
          <span>대표 글</span>
          <span>생성일 ↓</span>
          <span />
          <span />
        </div>
        <form action={pinAction}>
          {published.length === 0 ? (
            <p>고정할 공개 글이 없어요.</p>
          ) : (
            visiblePosts.map((post) => {
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
                    <span className={styles.categoryChip}>
                      {categories.find((category) => category.id === post.category_id)?.name ??
                        '미분류'}
                    </span>
                    {checked ? `${index + 1}. ` : ''}
                    {post.title}
                  </label>
                  <time data-label="생성일" dateTime={post.created_at ?? post.updated_at}>
                    {formatPostDate(post.created_at ?? post.updated_at)}
                  </time>
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
          {published.length > 0 && visiblePosts.length === 0 ? (
            <p>조건에 맞는 대표 글이 없어요.</p>
          ) : null}
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
