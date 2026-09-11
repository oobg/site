'use client';

import { useCallback, useEffect, useState } from 'react';
import styles from './CommentsSection.module.css';

type Comment = {
  id: string;
  nickname: string;
  avatar_id: string;
  body: string;
  created_at: string;
};

type CommentPage = { items: Comment[]; total: number; nextCursor: string | null };

const ADJECTIVES = ['고요한', '다정한', '단단한', '맑은', '반가운', '빛나는', '차분한', '푸른'];
const NOUNS = ['고래', '구름', '나무', '달빛', '모래', '새벽', '여우', '파도'];
const AVATAR_COUNT = 64;

function randomItem<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function randomIdentity() {
  return {
    nickname: `${randomItem(ADJECTIVES)}${randomItem(NOUNS)}`,
    avatarId: `clay-${String(Math.floor(Math.random() * AVATAR_COUNT) + 1).padStart(2, '0')}`,
  };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Seoul',
  }).format(new Date(value));
}

export function CommentsSection({ slug }: { slug: string }) {
  const [identity, setIdentity] = useState({ nickname: '', avatarId: 'clay-01' });
  const [body, setBody] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [total, setTotal] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState(false);
  const endpoint = `/api/posts/${encodeURIComponent(slug)}/comments`;

  const load = useCallback(
    async (cursor?: string, signal?: AbortSignal) => {
      const response = await fetch(
        cursor
          ? `${endpoint}?cursor=${encodeURIComponent(cursor)}&limit=20`
          : `${endpoint}?limit=20`,
        { signal },
      );
      const payload = (await response.json()) as CommentPage | { error?: { message?: string } };
      if (!response.ok || !('items' in payload)) {
        throw new Error('error' in payload ? payload.error?.message : undefined);
      }
      setComments((current) => (cursor ? [...current, ...payload.items] : payload.items));
      setTotal(payload.total);
      setNextCursor(payload.nextCursor);
    },
    [endpoint],
  );

  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(() => setIdentity(randomIdentity()));
    void fetch(`${endpoint}?limit=20`, { signal: controller.signal })
      .then(async (response) => {
        const payload = (await response.json()) as CommentPage | { error?: { message?: string } };
        if (!response.ok || !('items' in payload)) throw new Error();
        setComments(payload.items);
        setTotal(payload.total);
        setNextCursor(payload.nextCursor);
      })
      .catch((reason) => {
        if ((reason as Error).name !== 'AbortError') {
          setError('댓글을 불러오지 못했어요. 다시 시도해 주세요.');
          setLoadError(true);
        }
      })
      .finally(() => !controller.signal.aborted && setLoading(false));
    return () => controller.abort();
  }, [endpoint]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const content = body.trim();
    if (!content) return setError('댓글 내용을 입력해 주세요.');
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          nickname: identity.nickname.trim(),
          avatar_id: identity.avatarId,
          body: content,
        }),
      });
      const payload = (await response.json()) as {
        comment?: Comment;
        error?: { message?: string };
      };
      if (!response.ok || !payload.comment) {
        throw new Error(
          response.status === 429
            ? '잠시 뒤에 다시 남겨 주세요.'
            : payload.error?.message || '댓글을 등록하지 못했어요. 다시 시도해 주세요.',
        );
      }
      setComments((current) => [payload.comment as Comment, ...current]);
      setTotal((current) => current + 1);
      setBody('');
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : '댓글을 등록하지 못했어요. 다시 시도해 주세요.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    setError('');
    try {
      await load(nextCursor);
    } catch {
      setError('댓글을 더 불러오지 못했어요. 다시 시도해 주세요.');
    } finally {
      setLoadingMore(false);
    }
  };

  const retryLoad = async () => {
    setLoading(true);
    setLoadError(false);
    setError('');
    try {
      await load();
    } catch {
      setError('댓글을 불러오지 못했어요. 다시 시도해 주세요.');
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={styles.section} aria-labelledby="comments-title">
      <div className={styles.heading}>
        <h2 id="comments-title">댓글 {total}</h2>
      </div>
      <form className={styles.form} onSubmit={submit}>
        <div className={styles.identityRow}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/images/comment-avatars/${identity.avatarId}.webp`}
            alt=""
            className={styles.avatar}
          />
          <label className={styles.nicknameLabel}>
            <span className={styles.visuallyHidden}>닉네임</span>
            <input
              value={identity.nickname}
              maxLength={20}
              onChange={(event) =>
                setIdentity((current) => ({ ...current, nickname: event.target.value }))
              }
              required
            />
          </label>
          <button
            type="button"
            className={styles.randomButton}
            onClick={() => setIdentity(randomIdentity())}
          >
            랜덤 변경
          </button>
        </div>
        <label>
          <span className={styles.visuallyHidden}>댓글 내용</span>
          <textarea
            value={body}
            maxLength={1000}
            rows={4}
            placeholder="댓글을 남겨 주세요."
            onChange={(event) => setBody(event.target.value)}
            required
          />
        </label>
        <div className={styles.formFooter}>
          <span>{body.length}/1000</span>
          <button
            type="submit"
            disabled={loading || submitting || !body.trim() || !identity.nickname.trim()}
          >
            {submitting ? '등록 중…' : '댓글 등록'}
          </button>
        </div>
      </form>
      <p className={styles.status} role="status" aria-live="polite">
        {error}
      </p>
      {loadError ? (
        <button className={styles.more} type="button" onClick={retryLoad}>
          다시 시도
        </button>
      ) : null}
      {loading ? (
        <div className={styles.loading} aria-label="댓글을 불러오는 중" aria-busy="true">
          <span />
          <span />
          <span />
        </div>
      ) : loadError ? null : comments.length ? (
        <ul className={styles.list}>
          {comments.map((comment) => (
            <li key={comment.id} className={styles.comment}>
              <div className={styles.commentMeta}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/images/comment-avatars/${comment.avatar_id}.webp`}
                  alt=""
                  className={styles.commentAvatar}
                />
                <strong>{comment.nickname}</strong>
                <time dateTime={comment.created_at}>{formatDate(comment.created_at)}</time>
              </div>
              <p>{comment.body}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.empty}>첫 댓글을 남겨 보세요.</p>
      )}
      {nextCursor ? (
        <button className={styles.more} type="button" disabled={loadingMore} onClick={loadMore}>
          {loadingMore ? '불러오는 중…' : '댓글 더 보기'}
        </button>
      ) : null}
    </section>
  );
}
