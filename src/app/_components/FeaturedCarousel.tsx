'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import type { BlogPostSummary } from '@features/posts/types/posts.types';
import { ROUTES } from '@constants/routes';
import styles from './FeaturedCarousel.module.css';

const AUTOPLAY_MS = 10_000;

export function FeaturedCarousel({ posts }: { posts: readonly BlogPostSummary[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const start = useRef<{ x: number; y: number } | null>(null);
  const activeIndex = posts.length ? Math.min(index, posts.length - 1) : 0;

  useEffect(() => {
    if (posts.length <= 1 || paused) return;

    const timer = window.setInterval(
      () => setIndex((current) => (current + 1) % posts.length),
      AUTOPLAY_MS,
    );
    return () => window.clearInterval(timer);
  }, [activeIndex, paused, posts.length]);

  if (posts.length === 0) return null;
  const post = posts[activeIndex];
  const move = (step: number) => {
    setIndex((current) => (current + step + posts.length) % posts.length);
  };

  return (
    <section
      className={styles.section}
      aria-label="추천 글"
      data-with-cover={post.cover_image_url ? '' : undefined}
      data-paused={paused || undefined}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
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
          </div>
        )}
        <div className={styles.copy} data-with-cover={post.cover_image_url ? '' : undefined}>
          <div className={styles.metaRow}>
            <span className={styles.category}>{post.category.name}</span>
            {posts.length > 1 ? (
              <div className={styles.controls} role="group" aria-label="추천 글 탐색">
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
            ) : null}
          </div>
          <h2>
            <Link href={ROUTES.BLOG.DETAIL(post.category.slug, post.slug)}>{post.title}</Link>
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
