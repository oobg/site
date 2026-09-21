'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { CaretLeft, CaretRight, Pause, Play } from '@phosphor-icons/react';
import type { BlogPostSummary } from '@features/posts/types/posts.types';
import { ROUTES } from '@constants/routes';
import styles from './FeaturedCarousel.module.css';

const AUTOPLAY_MS = 10_000;
const PROGRESS_TICK_MS = 50;
const PROGRESS_RING_RADIUS = 19;
const PROGRESS_RING_CIRCUMFERENCE = 2 * Math.PI * PROGRESS_RING_RADIUS;
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';
/* .cover의 aspect-ratio 1.9와 같은 비율. 실제 표시 크기는 CSS가 정하고,
   이 값은 로드 전에 자리를 잡기 위한 비율 힌트로만 쓴다. */
const COVER_WIDTH = 1140;
const COVER_HEIGHT = 600;

function subscribeReducedMotion(onChange: () => void) {
  const media = window.matchMedia(REDUCED_MOTION);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

export function FeaturedCarousel({
  posts,
  headingId,
}: {
  posts: readonly BlogPostSummary[];
  /* 바깥에 보이는 제목이 있으면 그것을 영역 이름으로 쓴다. 안 그러면 화면에 보이는
     "추천 글"과 스크린리더가 읽는 "추천 글"이 각각 따로 존재하게 된다. */
  headingId?: string;
}) {
  const [index, setIndex] = useState(0);
  /* 정지 이유를 둘로 나눈다. hover/focus는 읽는 동안만 붙는 일시적 정지고,
     버튼은 사용자가 명시한 상태라 포인터가 떠나도 유지된다. */
  const [hovered, setHovered] = useState(false);
  const [choice, setChoice] = useState<boolean | null>(null);
  const [progress, setProgress] = useState(0);
  /* 자동 전환까지 읽어 주면 10초마다 스크린리더가 말을 끊는다. 사람이 직접 넘긴
     것만 알린다 — 자동 전환은 눈으로 보이는 카운터로 충분하다. */
  const [announcement, setAnnouncement] = useState('');
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
    const next = (activeIndex + step + posts.length) % posts.length;
    elapsedRef.current = 0;
    setProgress(0);
    setIndex(next);
    setAnnouncement(`${next + 1} / ${posts.length} · ${posts[next].title}`);
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
      aria-label={headingId ? undefined : '추천 글'}
      aria-labelledby={headingId}
      data-with-cover={post.cover_image_url ? '' : undefined}
      data-paused={paused || undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setHovered(false);
      }}
    >
      {/* 슬라이드 바깥에 둔다. 안에 두면 슬라이드가 바뀔 때 이 노드까지 새로 만들어져,
          스크린리더가 "바뀐 내용"이 아니라 "새로 생긴 영역"으로 보고 읽지 않는다. */}
      <span className={styles.announcer} aria-live="polite" aria-atomic="true">
        {announcement}
      </span>
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
              /* .cover가 aspect-ratio로 자리를 잡지만, 이미지 자체에 비율이 없으면
                 CSS가 오기 전 첫 프레임에서 높이가 0이라 레이아웃이 한 번 튄다. */
              width={COVER_WIDTH}
              height={COVER_HEIGHT}
              /* 첫 슬라이드는 접힘 위 LCP 후보다. 나머지는 이미 화면에 있으니
                 지연 로드가 오히려 빈 칸을 만든다. */
              loading="eager"
              decoding="async"
              fetchPriority={activeIndex === 0 ? 'high' : 'auto'}
              style={{
                objectPosition: `${post.cover_position.x * 100}% ${post.cover_position.y * 100}%`,
              }}
            />
          </div>
        )}
        <div className={styles.copy} data-with-cover={post.cover_image_url ? '' : undefined}>
          <div className={styles.metaRow}>
            <span className={styles.category}>{post.category.name}</span>
            {posts.length > 1 ? (
              <div className={styles.controls}>
                <div className={styles.autoplayControl}>
                  <span
                    className={styles.progressStatus}
                    role="progressbar"
                    aria-label="다음 추천 글 전환까지"
                    aria-valuemin={0}
                    aria-valuemax={AUTOPLAY_MS}
                    aria-valuenow={Math.round(progress * AUTOPLAY_MS)}
                    aria-valuetext={paused ? '일시정지' : `${remainingSeconds}초 후 전환`}
                  />
                  <button
                    type="button"
                    className={styles.autoplayButton}
                    onClick={toggleAutoplay}
                    aria-pressed={stopped}
                    aria-label={stopped ? '자동 전환 재생' : '자동 전환 일시정지'}
                  >
                    <svg className={styles.progressRing} viewBox="0 0 44 44" aria-hidden="true">
                      <circle
                        className={styles.progressRingTrack}
                        cx="22"
                        cy="22"
                        r={PROGRESS_RING_RADIUS}
                        fill="none"
                        strokeWidth="2"
                      />
                      <circle
                        className={styles.progressRingValue}
                        cx="22"
                        cy="22"
                        r={PROGRESS_RING_RADIUS}
                        fill="none"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeDasharray={PROGRESS_RING_CIRCUMFERENCE}
                        strokeDashoffset={PROGRESS_RING_CIRCUMFERENCE * (1 - progress)}
                      />
                    </svg>
                    <span className={styles.autoplayIcon}>
                      {stopped ? (
                        <Play aria-hidden size={15} weight="fill" />
                      ) : (
                        <Pause aria-hidden size={15} weight="fill" />
                      )}
                    </span>
                  </button>
                </div>
                <div className={styles.nav} role="group" aria-label="추천 글 탐색">
                  <button type="button" onClick={() => move(-1)} aria-label="이전 추천 글">
                    <CaretLeft aria-hidden size={17} weight="bold" />
                  </button>
                  {/* 읽을 수는 있게 두되 live는 아니다 — 지금 몇 번째인지는 언제든
                      확인할 수 있어야 하고, 자동 전환이 그것을 소리내서는 안 된다. */}
                  <span>
                    {activeIndex + 1} / {posts.length}
                  </span>
                  <button type="button" onClick={() => move(1)} aria-label="다음 추천 글">
                    <CaretRight aria-hidden size={17} weight="bold" />
                  </button>
                </div>
              </div>
            ) : null}
          </div>
          <h3>
            <Link href={ROUTES.BLOG.DETAIL(post.slug)}>{post.title}</Link>
          </h3>
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
