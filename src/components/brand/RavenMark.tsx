'use client';

import { useCallback, useEffect, useRef } from 'react';
import styles from './RavenMark.module.css';

/**
 * 브랜드 마크. 그림을 붙이지 않고 면으로 짓는다.
 *
 * 폴리곤 7개가 광원 하나를 공유하고, 면마다 각도가 달라 밝기가 따로 변한다.
 * 초점이 포인터를 따라가면 그림이 아니라 깎인 물체로 읽힌다.
 *
 * 각 면은 로드할 때 서로 다른 방향에서 모인다 — 한 방향으로 몰면 조각이 아니라
 * 판 하나로 읽힌다.
 *
 * 좌표는 2026-02 브랜드 에셋(`public/assets/logo.png`, main-legacy1)을 옮긴 것이다.
 * 원본 벡터가 확보되면 이 path를 교체한다.
 */
export function RavenMark({ decorative = false }: { decorative?: boolean }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const lampRef = useRef<SVGRadialGradientElement>(null);
  const rafRef = useRef(0);
  const target = useRef({ x: 0.3, y: 0.18 });
  const at = useRef({ x: 0.3, y: 0.18 });

  const push = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      const lamp = lampRef.current;
      if (!lamp) return;
      at.current.x += (target.current.x - at.current.x) * 0.08;
      at.current.y += (target.current.y - at.current.y) * 0.08;
      lamp.setAttribute('fx', `${(at.current.x * 100).toFixed(1)}%`);
      lamp.setAttribute('fy', `${(at.current.y * 100).toFixed(1)}%`);
    });
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      const rect = root.getBoundingClientRect();
      target.current.x = Math.max(-0.4, Math.min(1.4, (event.clientX - rect.left) / rect.width));
      target.current.y = Math.max(-0.4, Math.min(1.4, (event.clientY - rect.top) / rect.height));
      push();
    };

    /* 포인터가 없을 때도 빛은 아주 느리게 떠다닌다. 완전히 멈추면 조명이 꺼진 것처럼
       보이고, 재질이 아니라 그림이 된다. */
    let phase = 0;
    const drift = window.setInterval(() => {
      phase += 0.06;
      target.current.x = 0.42 + Math.cos(phase) * 0.26;
      target.current.y = 0.3 + Math.sin(phase * 0.8) * 0.2;
      push();
    }, 900);

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.clearInterval(drift);
      cancelAnimationFrame(rafRef.current);
    };
  }, [push]);

  return (
    <div className={styles.mark} ref={rootRef}>
      <span className={styles.halo} aria-hidden />
      <svg
        viewBox="0 0 320 300"
        role={decorative ? undefined : 'img'}
        aria-label={decorative ? undefined : 'raven.kr 심볼'}
        aria-hidden={decorative || undefined}
      >
        <defs>
          <radialGradient id="raven-lamp" cx="50%" cy="50%" r="78%" ref={lampRef}>
            <stop offset="0%" className={styles.s1} />
            <stop offset="34%" className={styles.s2} />
            <stop offset="72%" className={styles.s3} />
            <stop offset="100%" className={styles.s4} />
          </radialGradient>
          <linearGradient id="raven-edge" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" className={styles.s1} stopOpacity="0.55" />
            <stop offset="100%" className={styles.s3} stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* 면마다 불투명도를 달리 준다. 같은 광원인데 각도가 달라 다르게 받는다. */}
        <g stroke="url(#raven-edge)" strokeWidth="0.8" strokeLinejoin="round">
          <polygon className={`${styles.facet} ${styles.f1}`} points="212,38 302,72 252,104" />
          <polygon
            className={`${styles.facet} ${styles.f2}`}
            points="212,38 252,104 246,196 190,150"
          />
          <polygon className={`${styles.facet} ${styles.f3}`} points="212,38 190,150 146,118" />
          <polygon
            className={`${styles.facet} ${styles.f4}`}
            points="146,118 190,150 152,214 58,250"
          />
          <polygon className={`${styles.facet} ${styles.f5}`} points="58,250 152,214 96,258" />
          <polygon
            className={`${styles.facet} ${styles.f6}`}
            points="190,150 246,196 198,262 152,214"
          />
          <polygon className={`${styles.facet} ${styles.f7}`} points="152,214 198,262 168,244" />
        </g>
      </svg>
    </div>
  );
}
