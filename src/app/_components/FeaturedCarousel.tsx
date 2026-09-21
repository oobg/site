'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { CaretLeft, CaretRight, Pause, Play } from '@phosphor-icons/react';
import type { BlogPostSummary } from '@features/posts/types/posts.types';
import { ROUTES } from '@constants/routes';
import styles from './FeaturedCarousel.module.css';

const AUTOPLAY_MS = 10_000;
const PROGRESS_TICK_MS = 50;
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

function subscribeReducedMotion(onChange: () => void) {
  const media = window.matchMedia(REDUCED_MOTION);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

export function FeaturedCarousel({ posts }: { posts: readonly BlogPostSummary[] }) {
  const [index, setIndex] = useState(0);
  /* 정지 이유를 둘로 나눈다. hover/focus는 읽는 동안만 붙는 일시적 정지고,
     버튼은 사용자가 명시한 상태라 포인터가 떠나도 유지된다. */
  const [hovered, setHovered] = useState(false);
  const [choice, setChoice] = useState<boolean | null>(null);
  const [progress, setProgress] = useState(0);
  const start = useRef<{ x: number; y: number } | null>(null);
  const elapsedRef = useRef(0);
  const activeIndex = posts.length ? Math.min(index, posts.length - 1) : 0;
  /* 모션 축소를 켠 사람에게는 자동 전환이 꺼진 채 시작한다. 서버 스냅샷을 false로 두어
     하이드레이션 이후에 반영하고, 버튼을 한 번이라도 누르면 그 선택이 설정을 이긴다. */
  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
  const stopped = choice ?? prefersReducedMotion;
  const paused = hovered || stopped;

  useEffect(() => {
    if (posts.length <= 1) {
      elapsedRef.current = 0;
      return;
    }
    if (paused) return;

    const startedAt = Date.now() - elapsedRef.current;
    const timer = window.setInterval(() => {
      const elapsed = Math.min(Date.now() - startedAt, AUTOPLAY_MS);
      elapsedRef.current = elapsed;
      setProgress(elapsed / AUTOPLAY_MS);
      if (elapsed >= AUTOPLAY_MS) {
        elapsedRef.current = 0;
        setProgress(0);
        setIndex((activeIndex + 1) % posts.length);
      }
    }, PROGRESS_TICK_MS);
    return () => window.clearInterval(timer);
  }, [activeIndex, paused, posts.length]);

  if (posts.length === 0) return null;
  const post = posts[activeIndex];
  const move = (step: number) => {
    elapsedRef.current = 0;
    setProgress(0);
    setIndex((activeIndex + step + posts.length) % posts.length);
  };
  /* 재생을 누르면 hover/focus로 걸린 정지까지 함께 푼다. 그러지 않으면 버튼에 포커스가
     남은 키보드 사용자에게 재생이 아무 일도 하지 않는 것처럼 보인다. */
  const toggleAutoplay = () => {
    const next = !stopped;
    setChoice(next);
    if (!next) setHovered(false);
  };
  const remainingSeconds = Math.max(1, Math.ceil((AUTOPLAY_MS * (1 - progress)) / 1000));

  return (
    <section
      className={styles.section}
      aria-label="추천 글"
      data-with-cover={post.cover_image_url ? '' : undefined}
      data-paused={paused || undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setHovered(false);
      }}
    >
      <div
        key={post.slug}
        className={styles.slide}
        onTouchStart={(event) => {
          const touch = event.touches[0];
          start.current = { x: touch.clientX, y: touch.clientY };
        }}
        onTouchEnd={(event) => {
          const origin = start.current;
          start.current = null;
          if (!origin) return;
          const touch = event.changedTouches[0];
          const dx = touch.clientX - origin.x;
          const dy = touch.clientY - origin.y;
          if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) move(dx < 0 ? 1 : -1);
        }}
      >
        {post.cover_image_url && (
          <div className={styles.cover}>
            <img
              src={post.cover_image_url}
              alt={post.cover_alt ?? ''}
              style={{
                objectPosition: `${post.cover_position.x * 100}% ${post.cover_position.y * 100}%`,
              }}
            />
            {posts.length > 1 ? (
              <div
                className={styles.progressTrack}
                role="progressbar"
                aria-label="다음 추천 글 전환까지"
                aria-valuemin={0}
                aria-valuemax={AUTOPLAY_MS}
                aria-valuenow={Math.round(progress * AUTOPLAY_MS)}
                aria-valuetext={paused ? '일시정지' : `${remainingSeconds}초 후 전환`}
              >
                <span className={styles.progressBar} style={{ transform: `scaleX(${progress})` }} />
              </div>
            ) : null}
          </div>
        )}
        <div className={styles.copy} data-with-cover={post.cover_image_url ? '' : undefined}>
          <div className={styles.metaRow}>
            <span className={styles.category}>{post.category.name}</span>
            {posts.length > 1 ? (
              <div className={styles.controls}>
                <button
                  type="button"
                  onClick={toggleAutoplay}
                  aria-pressed={stopped}
                  aria-label={stopped ? '자동 전환 재생' : '자동 전환 일시정지'}
                >
                  {stopped ? (
                    <Play aria-hidden size={15} weight="fill" />
                  ) : (
                    <Pause aria-hidden size={15} weight="fill" />
                  )}
                </button>
                <div className={styles.nav} role="group" aria-label="추천 글 탐색">
                  <button type="button" onClick={() => move(-1)} aria-label="이전 추천 글">
                    <CaretLeft aria-hidden size={17} weight="bold" />
                  </button>
                  <span aria-live="polite" aria-atomic="true">
                    {activeIndex + 1} / {posts.length}
                  </span>
                  <button type="button" onClick={() => move(1)} aria-label="다음 추천 글">
                    <CaretRight aria-hidden size={17} weight="bold" />
                  </button>
                </div>
              </div>
            ) : null}
          </div>
          <h2>
            <Link href={ROUTES.BLOG.DETAIL(post.slug)}>{post.title}</Link>
          </h2>
          {post.summary && <p>{post.summary}</p>}
          <time dateTime={post.published_at}>
            {new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' }).format(
              new Date(post.published_at),
            )}
          </time>
        </div>
      </div>
    </section>
  );
}
