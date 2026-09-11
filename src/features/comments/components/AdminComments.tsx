'use client';

import { useEffect, useState } from 'react';
import { getCommentAvatarUrl } from '@features/comments/utils/comment-avatar';
import styles from './AdminComments.module.css';

import type { AdminComment, Comment } from '@features/comments/types/comments.types';

export function AdminComments({ avatarBaseUrl }: { avatarBaseUrl?: string }) {
  const [items, setItems] = useState<AdminComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState('');
  const [replyError, setReplyError] = useState('');
  const [replyPending, setReplyPending] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/comments');
      const payload = (await response.json()) as { items?: AdminComment[] };
      if (!response.ok || !payload.items) throw new Error();
      setItems(payload.items);
    } catch {
      setError('댓글을 불러오지 못했어요.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    void fetch('/api/admin/comments', { signal: controller.signal })
      .then(async (response) => {
        const payload = (await response.json()) as { items?: AdminComment[] };
        if (!response.ok || !payload.items) throw new Error();
        setItems(payload.items);
      })
      .catch((reason) => {
        if ((reason as Error).name !== 'AbortError') setError('댓글을 불러오지 못했어요.');
      })
      .finally(() => !controller.signal.aborted && setLoading(false));
    return () => controller.abort();
  }, []);

  const remove = async (id: string) => {
    if (pendingId) return;
    setPendingId(id);
    setError('');
    try {
      const response = await fetch('/api/admin/comments', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) throw new Error();
      setItems((current) => current.filter((item) => item.id !== id && item.parent_id !== id));
    } catch {
      setError('댓글을 삭제하지 못했어요. 다시 시도해 주세요.');
    } finally {
      setPendingId(null);
    }
  };

  const toggleVisibility = async (item: AdminComment) => {
    if (pendingId) return;
    setPendingId(item.id);
    setError('');
    const status = item.moderation_status === 'visible' ? 'hidden' : 'visible';
    try {
      const response = await fetch('/api/admin/comments', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: item.id, status }),
      });
      if (!response.ok) throw new Error();
      setItems((current) =>
        current.map((comment) =>
          comment.id === item.id ? { ...comment, moderation_status: status } : comment,
        ),
      );
    } catch {
      setError('댓글 상태를 바꾸지 못했어요. 다시 시도해 주세요.');
    } finally {
      setPendingId(null);
    }
  };

  const submitReply = async (event: React.FormEvent, parent: AdminComment) => {
    event.preventDefault();
    const content = replyBody.trim();
    if (
      replyPending ||
      pendingId ||
      !content ||
      content.length > 1000 ||
      content.includes('\u0000')
    )
      return;
    setReplyPending(true);
    setReplyError('');
    try {
      const response = await fetch('/api/admin/comments', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ parent_id: parent.id, body: content }),
      });
      const payload = (await response.json()) as {
        comment?: Comment;
        error?: { message?: string };
      };
      if (!response.ok || !payload.comment)
        throw new Error(payload.error?.message || '답글을 등록하지 못했어요. 다시 시도해 주세요.');
      const reply: AdminComment = {
        ...payload.comment,
        post_slug: parent.post_slug,
        moderation_status: 'visible',
      };
      setItems((current) => [...current, reply]);
      setReplyTo(null);
      setReplyBody('');
    } catch (reason) {
      setReplyError(reason instanceof Error ? reason.message : '답글을 등록하지 못했어요.');
    } finally {
      setReplyPending(false);
    }
  };

  const orderedItems = items
    .filter((item) => !item.parent_id)
    .flatMap((parent) => [
      parent,
      ...items
        .filter((item) => item.parent_id === parent.id)
        .sort(
          (a, b) => Date.parse(a.created_at) - Date.parse(b.created_at) || a.id.localeCompare(b.id),
        ),
    ]);

  if (loading)
    return (
      <div className={styles.loading} aria-label="댓글을 불러오는 중" aria-busy="true">
        <span />
        <span />
        <span />
      </div>
    );
  return (
    <div className={styles.wrap}>
      {error ? (
        <div className={styles.error} role="alert">
          <span>{error}</span>
          <button type="button" onClick={load}>
            다시 시도
          </button>
        </div>
      ) : null}
      {items.length ? (
        <ul className={styles.list}>
          {orderedItems.map((item) => (
            <li
              key={item.id}
              className={styles.item}
              data-reply={Boolean(item.parent_id)}
              aria-label={item.parent_id ? `${item.nickname} 답글` : `${item.nickname} 댓글`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={getCommentAvatarUrl(item.avatar_id, avatarBaseUrl)} alt="" />
              <div>
                <div className={styles.meta}>
                  {item.parent_id ? <span aria-hidden="true">ㄴ&gt;</span> : null}
                  <strong>{item.nickname}</strong>
                  {item.is_author ? <span className={styles.authorBadge}>작성자</span> : null}
                  <span>/{item.post_slug}</span>
                  {item.moderation_status === 'hidden' ? <em>숨김</em> : null}
                </div>
                <p>{item.body}</p>
              </div>
              <div className={styles.actions}>
                {!item.parent_id ? (
                  <button
                    type="button"
                    disabled={Boolean(pendingId) || replyPending}
                    aria-expanded={replyTo === item.id}
                    aria-controls={`reply-form-${item.id}`}
                    onClick={() => {
                      setReplyTo(item.id);
                      setReplyBody('');
                      setReplyError('');
                    }}
                  >
                    답글
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={Boolean(pendingId) || replyPending}
                  onClick={() => toggleVisibility(item)}
                >
                  {item.moderation_status === 'visible' ? '숨기기' : '다시 표시'}
                </button>
                <button
                  type="button"
                  disabled={Boolean(pendingId) || replyPending}
                  onClick={() => remove(item.id)}
                  aria-label={`${item.nickname} 댓글 삭제`}
                >
                  삭제
                </button>
              </div>
              {replyTo === item.id && !item.parent_id ? (
                <form
                  id={`reply-form-${item.id}`}
                  className={styles.replyForm}
                  onSubmit={(event) => submitReply(event, item)}
                  aria-busy={replyPending}
                >
                  <label htmlFor={`reply-body-${item.id}`}>{item.nickname}님에게 답글</label>
                  <textarea
                    id={`reply-body-${item.id}`}
                    value={replyBody}
                    maxLength={1000}
                    rows={3}
                    required
                    autoFocus
                    disabled={replyPending}
                    onChange={(event) => setReplyBody(event.target.value)}
                    aria-describedby={replyError ? `reply-error-${item.id}` : undefined}
                  />
                  {replyError ? (
                    <p id={`reply-error-${item.id}`} role="alert">
                      {replyError}
                    </p>
                  ) : null}
                  <div className={styles.actions}>
                    <button
                      type="button"
                      disabled={replyPending}
                      onClick={() => {
                        setReplyTo(null);
                        setReplyBody('');
                        setReplyError('');
                      }}
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      disabled={
                        replyPending ||
                        Boolean(pendingId) ||
                        !replyBody.trim() ||
                        replyBody.trim().length > 1000 ||
                        replyBody.includes('\u0000')
                      }
                    >
                      {replyPending ? '등록 중…' : '답글 등록'}
                    </button>
                  </div>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.empty}>아직 댓글이 없어요.</p>
      )}
    </div>
  );
}
