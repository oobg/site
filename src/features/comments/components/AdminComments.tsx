'use client';

import { useEffect, useState } from 'react';
import { getCommentAvatarUrl } from '@features/comments/utils/comment-avatar';
import styles from './AdminComments.module.css';

type AdminComment = {
  id: string;
  nickname: string;
  avatar_id: string;
  body: string;
  created_at: string;
  post_slug: string;
  moderation_status: 'visible' | 'hidden';
};

export function AdminComments({ avatarBaseUrl }: { avatarBaseUrl?: string }) {
  const [items, setItems] = useState<AdminComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
      setItems((current) => current.filter((item) => item.id !== id));
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
          {items.map((item) => (
            <li key={item.id} className={styles.item}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={getCommentAvatarUrl(item.avatar_id, avatarBaseUrl)} alt="" />
              <div>
                <div className={styles.meta}>
                  <strong>{item.nickname}</strong>
                  <span>/{item.post_slug}</span>
                  {item.moderation_status === 'hidden' ? <em>숨김</em> : null}
                </div>
                <p>{item.body}</p>
              </div>
              <div className={styles.actions}>
                <button
                  type="button"
                  disabled={pendingId === item.id}
                  onClick={() => toggleVisibility(item)}
                >
                  {item.moderation_status === 'visible' ? '숨기기' : '다시 표시'}
                </button>
                <button
                  type="button"
                  disabled={pendingId === item.id}
                  onClick={() => remove(item.id)}
                  aria-label={`${item.nickname} 댓글 삭제`}
                >
                  삭제
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.empty}>아직 댓글이 없어요.</p>
      )}
    </div>
  );
}
