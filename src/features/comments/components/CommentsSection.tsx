'use client';

import { useCallback, useEffect, useState } from 'react';
import { getCommentAvatarUrl } from '@features/comments/utils/comment-avatar';
import styles from './CommentsSection.module.css';

type Comment = {
  id: string;
  nickname: string;
  avatar_id: string;
  body: string;
  created_at: string;
};

type CommentPage = { items: Comment[]; total: number; nextCursor: string | null };

const ADJECTIVES = [
  '고요한',
  '다정한',
  '단단한',
  '맑은',
  '반가운',
  '빛나는',
  '차분한',
  '푸른',
  '씩씩한',
  '귀여운',
  '포근한',
  '산뜻한',
  '즐거운',
  '명랑한',
  '용감한',
  '든든한',
  '따뜻한',
  '소중한',
  '신나는',
  '기운찬',
  '활기찬',
  '정다운',
  '행복한',
  '상냥한',
  '순한',
  '밝은',
  '환한',
  '눈부신',
  '찬란한',
  '반짝이는',
  '싱그러운',
  '향기로운',
  '달콤한',
  '새콤한',
  '상쾌한',
  '시원한',
  '보드라운',
  '말랑한',
  '폭신한',
  '동그란',
  '조그만',
  '커다란',
  '아담한',
  '날렵한',
  '재빠른',
  '느긋한',
  '부지런한',
  '성실한',
  '영리한',
  '지혜로운',
  '재치 넘치는',
  '유쾌한',
  '익살스러운',
  '궁금한',
  '정직한',
  '친절한',
  '정성스러운',
  '섬세한',
  '야무진',
  '당찬',
  '대담한',
  '굳센',
  '힘찬',
  '튼튼한',
  '강인한',
  '자유로운',
  '평화로운',
  '여유로운',
  '낭만적인',
  '설레는',
  '꿈꾸는',
  '피어나는',
  '자라나는',
  '춤추는',
  '노래하는',
  '달리는',
  '날아가는',
  '헤엄치는',
  '여행하는',
  '모험하는',
  '탐험하는',
  '발견하는',
  '집중하는',
  '생각하는',
  '응원하는',
  '사랑스러운',
  '사랑받는',
  '복된',
  '운 좋은',
  '희망찬',
  '자신 있는',
  '믿음직한',
  '자랑스러운',
  '멋진',
  '근사한',
  '특별한',
  '새로운',
  '신비로운',
  '놀라운',
  '신기한',
  '재미난',
  '흥미로운',
  '독특한',
  '엉뚱한',
  '수줍은',
  '얌전한',
  '온화한',
  '담백한',
  '깔끔한',
  '선명한',
  '화사한',
  '알록달록한',
  '초롱초롱한',
  '반듯한',
  '올곧은',
  '부드러운',
  '매끄러운',
  '촉촉한',
  '뽀송한',
  '바삭한',
  '아삭한',
  '통통한',
  '작은',
  '넉넉한',
  '풍성한',
  '풍요로운',
  '푸근한',
  '정겨운',
] as const;

const AVATARS = [
  { id: 'clay-01', name: '사과' },
  { id: 'clay-02', name: '바나나' },
  { id: 'clay-03', name: '딸기' },
  { id: 'clay-04', name: '레몬' },
  { id: 'clay-05', name: '수박' },
  { id: 'clay-06', name: '크루아상' },
  { id: 'clay-07', name: '도넛' },
  { id: 'clay-08', name: '케이크' },
  { id: 'clay-09', name: '커피' },
  { id: 'clay-10', name: '녹차' },
  { id: 'clay-11', name: '아이스크림' },
  { id: 'clay-12', name: '사탕' },
  { id: 'clay-13', name: '팝콘' },
  { id: 'clay-14', name: '아보카도' },
  { id: 'clay-15', name: '고추' },
  { id: 'clay-16', name: '당근' },
  { id: 'clay-17', name: '해바라기' },
  { id: 'clay-18', name: '네잎클로버' },
  { id: 'clay-19', name: '선인장' },
  { id: 'clay-20', name: '버섯' },
  { id: 'clay-21', name: '단풍잎' },
  { id: 'clay-22', name: '소나무' },
  { id: 'clay-23', name: '파도' },
  { id: 'clay-24', name: '구름' },
  { id: 'clay-25', name: '태양' },
  { id: 'clay-26', name: '달' },
  { id: 'clay-27', name: '무지개' },
  { id: 'clay-28', name: '눈송이' },
  { id: 'clay-29', name: '불꽃' },
  { id: 'clay-30', name: '물방울' },
  { id: 'clay-31', name: '번개' },
  { id: 'clay-32', name: '별' },
  { id: 'clay-33', name: '전구' },
  { id: 'clay-34', name: '압정' },
  { id: 'clay-35', name: '열쇠' },
  { id: 'clay-36', name: '자석' },
  { id: 'clay-37', name: '팔레트' },
  { id: 'clay-38', name: '붓' },
  { id: 'clay-39', name: '연필' },
  { id: 'clay-40', name: '책' },
  { id: 'clay-41', name: '카메라' },
  { id: 'clay-42', name: '헤드폰' },
  { id: 'clay-43', name: '레코드' },
  { id: 'clay-44', name: '기타' },
  { id: 'clay-45', name: '축구공' },
  { id: 'clay-46', name: '농구공' },
  { id: 'clay-47', name: '스케이트보드' },
  { id: 'clay-48', name: '게임패드' },
  { id: 'clay-49', name: '자동차' },
  { id: 'clay-50', name: '자전거' },
  { id: 'clay-51', name: '돛단배' },
  { id: 'clay-52', name: '비행기' },
  { id: 'clay-53', name: '로켓' },
  { id: 'clay-54', name: '열기구' },
  { id: 'clay-55', name: '기차' },
  { id: 'clay-56', name: '우산' },
  { id: 'clay-57', name: '선물' },
  { id: 'clay-58', name: '풍선' },
  { id: 'clay-59', name: '다이아몬드' },
  { id: 'clay-60', name: '수정구슬' },
  { id: 'clay-61', name: '모래시계' },
  { id: 'clay-62', name: '알람시계' },
  { id: 'clay-63', name: '종이비행기' },
  { id: 'clay-64', name: '집' },
] as const;

function randomItem<T>(items: readonly T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function randomIdentity() {
  const avatar = randomItem(AVATARS);

  return {
    nickname: `${randomItem(ADJECTIVES)} ${avatar.name}`,
    avatarId: avatar.id,
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

export function CommentsSection({ slug, avatarBaseUrl }: { slug: string; avatarBaseUrl?: string }) {
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
            src={getCommentAvatarUrl(identity.avatarId, avatarBaseUrl)}
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
                  src={getCommentAvatarUrl(comment.avatar_id, avatarBaseUrl)}
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
