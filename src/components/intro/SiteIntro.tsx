// src/components/intro/SiteIntro.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAnimate } from 'motion/react';
import { useIntro } from './IntroProvider';
import styles from './SiteIntro.module.css';

const DRAW_MS = 900;
const SETTLE_MS = 200;
const FADE_MS = 300;
// 기존 PPOS ease 톤과 결이 맞는 부드러운 커브(급가속·bounce 없음).
const EASE = [0.22, 0.61, 0.36, 1] as const;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function SiteIntro() {
  const { playing, finish } = useIntro();
  const [scope, animate] = useAnimate();
  // 오버레이는 항상 SSR HTML에 렌더되어야 함(플래시 방지). 표시 여부는 CSS(html[data-intro])가 결정하고,
  // 실제 언마운트는 안무 완료 후(아래 async 콜백)에만 일어난다. 효과 내 동기 setState는 없다.
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    if (!playing) return;
    let cancelled = false;
    (async () => {
      try {
        await Promise.all([
          animate('[data-intro-hairline]', { scaleX: 1 }, { duration: DRAW_MS / 1000, ease: EASE }),
          animate(
            '[data-intro-wordmark]',
            { opacity: 1, letterSpacing: '0em' },
            { duration: DRAW_MS / 1000, ease: EASE },
          ),
        ]);
        if (cancelled) return;
        await wait(SETTLE_MS);
        if (cancelled) return;
        finish();
        await animate(scope.current, { opacity: 0 }, { duration: FADE_MS / 1000, ease: EASE });
        if (!cancelled) setRemoved(true);
      } catch {
        if (!cancelled) {
          finish();
          setRemoved(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [playing, animate, finish, scope]);

  if (removed) return null;

  return (
    <div ref={scope} className={styles.overlay} data-intro-overlay aria-hidden="true">
      <div className={styles.container}>
        <div className={styles.masthead}>
          <span className={styles.wordmark} data-intro-wordmark>
            raven.kr
          </span>
        </div>
      </div>
      <div className={styles.hairline} data-intro-hairline />
    </div>
  );
}
