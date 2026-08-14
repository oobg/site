'use client';

import { useEffect, useRef } from 'react';
import styles from './RavenMark.module.css';

/** viewBox 좌표계. 광원 좌표를 여기에 맞춰야 면 전체가 한 광원을 공유한다. */
const VB_W = 320;
const VB_H = 300;
/** 포인터를 놓고 이만큼 지나면 빛이 다시 혼자 떠다닌다. */
const IDLE_MS = 3000;

/**
 * 브랜드 마크. 그림을 붙이지 않고 면으로 짓는다.
 *
 * 폴리곤 일곱이 광원 하나를 공유하고, 초점이 포인터를 따라가면 면마다 각도가 달라
 * 밝기가 따로 변한다. 그래서 그림이 아니라 깎인 물체로 읽힌다.
 *
 * 좌표는 2026-02 브랜드 에셋(main-legacy1의 public/assets/logo.png)을 옮긴 근사치다.
 * 원본 벡터가 확보되면 polygon points를 교체한다.
 */
export function RavenMark() {
  const rootRef = useRef<HTMLDivElement>(null);
  const lampRef = useRef<SVGRadialGradientElement>(null);
  const rafRef = useRef(0);
  const target = useRef({ x: 0.32, y: 0.2 });
  const at = useRef({ x: 0.32, y: 0.2 });

  useEffect(() => {
    const root = rootRef.current;
    const lamp = lampRef.current;
    if (!root || !lamp) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    /* 목표에 닿을 때까지 프레임을 이어간다. 이벤트마다 한 프레임만 돌리면
       포인터가 멈추는 순간 빛도 가는 길에 멈춰 서서 따라오지 않는 것처럼 보인다. */
    const tick = () => {
      const dx = target.current.x - at.current.x;
      const dy = target.current.y - at.current.y;
      at.current.x += dx * 0.12;
      at.current.y += dy * 0.12;
      lamp.setAttribute('fx', (at.current.x * VB_W).toFixed(1));
      lamp.setAttribute('fy', (at.current.y * VB_H).toFixed(1));
      rafRef.current =
        Math.abs(dx) > 0.0015 || Math.abs(dy) > 0.0015 ? requestAnimationFrame(tick) : 0;
    };
    const kick = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };

    let lastPointer = 0;
    /* 히어로를 벗어나면 손을 따라가지 않는다. 배경 잔광은 그 지점에서 꺼지는데
       마크만 계속 따라가면 빛이 둘로 갈라져 보인다. 대신 유휴로 돌아가 혼자 떠다닌다. */
    const scope = root.closest('section') ?? root;

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      const bounds = scope.getBoundingClientRect();
      const inside =
        event.clientX >= bounds.left &&
        event.clientX <= bounds.right &&
        event.clientY >= bounds.top &&
        event.clientY <= bounds.bottom;
      if (!inside) return;

      const rect = root.getBoundingClientRect();
      /* fx·fy가 cx·cy·r이 그리는 원 밖으로 나가면 브라우저가 가장자리로 잘라내
         빛이 멈춘 것처럼 보인다. 0~1로 묶어 항상 원 안에 두었다. */
      target.current.x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      target.current.y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
      lastPointer = performance.now();
      kick();
    };

    /* 포인터가 없을 때만 아주 느리게 떠다닌다. 손을 대고 있는 동안 끼어들면
       방금 따라온 위치를 덮어써서 빛이 손을 뿌리치는 것처럼 보인다. */
    let phase = 0;
    const drift = window.setInterval(() => {
      if (performance.now() - lastPointer < IDLE_MS) return;
      phase += 0.06;
      target.current.x = 0.45 + Math.cos(phase) * 0.24;
      target.current.y = 0.34 + Math.sin(phase * 0.8) * 0.18;
      kick();
    }, 900);

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.clearInterval(drift);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className={styles.mark} ref={rootRef}>
      <span className={styles.halo} aria-hidden />
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} role="img" aria-label="raven.kr 심볼">
        <defs>
          {/* userSpaceOnUse가 핵심이다. 기본값(objectBoundingBox)이면 폴리곤마다
              자기 바운딩박스에 그라디언트를 따로 매핑해, 광원이 하나가 아니라
              면 수만큼 생긴다. 그러면 각도에 따라 다르게 받는다는 전제가 사라진다. */}
          <radialGradient
            id="raven-lamp"
            ref={lampRef}
            gradientUnits="userSpaceOnUse"
            cx={VB_W / 2}
            cy={VB_H / 2}
            r={VB_W * 0.78}
            fx={VB_W * 0.32}
            fy={VB_H * 0.2}
          >
            <stop offset="0%" className={styles.s1} />
            <stop offset="34%" className={styles.s2} />
            <stop offset="72%" className={styles.s3} />
            <stop offset="100%" className={styles.s4} />
          </radialGradient>
          <linearGradient
            id="raven-edge"
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1="0"
            x2={VB_W}
            y2={VB_H}
          >
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
