'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { PostListItem } from '@features/posts/types/posts.types';
import { ROUTES } from '@constants/routes';
import styles from './RecentPosts.module.css';

/**
 * 읽은 글 표시. 브라우저에만 남고 서버로 보내지 않는다.
 *
 * localStorage는 React 밖의 저장소라 useSyncExternalStore로 읽는다. 이펙트에서
 * setState로 끌어오면 마운트마다 연쇄 렌더가 나고, 서버 스냅샷이 없어 하이드레이션도
 * 어긋난다. 스냅샷은 같은 내용이면 같은 참조를 돌려줘야 무한 루프가 나지 않는다.
 */
const READ_KEY = 'raven:read';
const EMPTY: ReadonlySet<string> = new Set();

let cachedRaw: string | null = null;
let cachedSet: ReadonlySet<string> = EMPTY;
const listeners = new Set<() => void>();

function readSnapshot(): ReadonlySet<string> {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(READ_KEY);
  } catch {
    return EMPTY;
  }
  if (raw === cachedRaw) return cachedSet;
  cachedRaw = raw;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    cachedSet =
      Array.isArray(parsed) && parsed.every((value) => typeof value === 'string')
        ? new Set(parsed)
        : EMPTY;
  } catch {
    cachedSet = EMPTY;
  }
  return cachedSet;
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener('storage', onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('storage', onChange);
  };
}

/** 다른 탭이 아니라 이 탭에서 바꿨을 때는 storage 이벤트가 안 오므로 직접 알린다. */
function persistRead(slug: string) {
  try {
    const next = new Set(readSnapshot()).add(slug);
    window.localStorage.setItem(READ_KEY, JSON.stringify([...next]));
  } catch {
    /* 사파리 프라이빗 모드 등 — 표시가 안 남을 뿐 이동은 그대로 된다. */
  }
  for (const notify of listeners) notify();
}

/**
 * 최근 글 목록.
 *
 * 제목만으로는 열지 말지 판단할 근거가 없어 요약을 한 줄 붙인다(API의 summary 필드).
 * 읽은 글에는 빛이 한 번 지나간 자국이 남아, 재방문했을 때 어디까지 봤는지 바로 보인다.
 * j/k로 이동하고 ↵로 연다 — 표시만 있는 장식이 아니라 실제로 동작한다.
 */
export function RecentPosts({ posts }: { posts: PostListItem[] }) {
  const listRef = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(-1);
  /* 서버 스냅샷은 항상 빈 집합이다 — 읽은 기록은 브라우저에만 있으므로
     서버가 알 수 없고, 안다고 렌더하면 하이드레이션이 어긋난다. */
  const read = useSyncExternalStore(subscribe, readSnapshot, () => EMPTY);

  useEffect(() => {
    if (posts.length === 0) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable || /input|textarea|select/i.test(target.tagName))
      ) {
        return;
      }
      const move = (delta: number) => {
        event.preventDefault();
        setActive((prev) => {
          const next = Math.max(0, Math.min(posts.length - 1, prev + delta));
          listRef.current?.querySelectorAll('li')[next]?.focus();
          return next;
        });
      };
      if (event.key === 'j' || event.key === 'ArrowDown') move(1);
      else if (event.key === 'k' || event.key === 'ArrowUp') move(active <= 0 ? 0 : -1);
      else if (
        event.key === 'Enter' &&
        active >= 0 &&
        listRef.current?.querySelectorAll('li')[active] === document.activeElement
      ) {
        event.preventDefault();
        /* 진짜 링크를 누른다. 라우터로 직접 밀면 가운데클릭·⌘클릭이 죽는다. */
        listRef.current?.querySelectorAll('a')[active]?.click();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, posts]);

  if (posts.length === 0) return null;

  return (
    <section className={styles.section}>
      <p className={styles.label}>
        최근에 쓴 글 <span className={styles.keys}>j k 로 이동 · ↵ 로 열기</span>
      </p>
      <ul className={styles.list} ref={listRef}>
        {posts.map((post, index) => (
          <li
            key={post.slug}
            className={index === active ? `${styles.row} ${styles.active}` : styles.row}
            data-read={read.has(post.slug) || undefined}
            tabIndex={-1}
          >
            <time className={styles.when} dateTime={post.published_at}>
              {post.published_at.slice(5, 10)}
            </time>
            <a
              className={styles.what}
              href={ROUTES.BLOG.DETAIL(post.slug)}
              onClick={() => persistRead(post.slug)}
            >
              {post.title}
            </a>
            {post.reading_time_min ? (
              <span className={styles.len}>{post.reading_time_min}분</span>
            ) : null}
            {post.summary ? <span className={styles.sum}>{post.summary}</span> : null}
          </li>
        ))}
      </ul>
      <a className={styles.more} href={ROUTES.BLOG.LIST}>
        글 전체 보기 <span aria-hidden>→</span>
      </a>
    </section>
  );
}
