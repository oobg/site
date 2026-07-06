'use client';

import { useEffect, useState } from 'react';
import { useAnimate } from 'motion/react';
import { useIntro } from './IntroProvider';
import styles from './SiteIntro.module.css';

const FILL_MS = 850; // 글자 내부가 아래→위로 차오르는 시간
const SETTLE_MS = 120; // 다 찬 뒤 잠깐의 숨
const MOVE_MS = 450; // 좌상단 헤더 워드마크로 축소·이동
const FADE_MS = 280; // 오버레이 페이드아웃(핸드오프)
// 기존 PPOS ease 톤과 결이 맞는 부드러운 커브(급가속·bounce 없음).
const EASE = [0.22, 0.61, 0.36, 1] as const;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function SiteIntro() {
  const { playing, finish } = useIntro();
  const [scope, animate] = useAnimate();
  // 오버레이는 항상 SSR HTML에 렌더되어야 함(플래시 방지). 표시 여부는 CSS(html[data-intro])가 결정하고,
  // 실제 언마운트는 안무 완료 후(아래 async 콜백)에만 일어난다.
  const [removed, setRemoved] = useState(false);
  // 재생 여부는 마운트 시점에 확정한다(스냅샷). finish()가 context의 playing을 false로 바꿔도
  // 이 값은 불변이므로 타임라인 effect가 재실행/취소되지 않는다(핸드오프 후 언마운트 보장).
  const [shouldPlay] = useState(playing);

  useEffect(() => {
    if (!shouldPlay) return;
    let cancelled = false;
    (async () => {
      try {
        // 1) 글자 내부가 아래→위로 채워짐(잉크 게이지).
        await animate(
          '[data-intro-fill]',
          { clipPath: ['inset(100% 0% 0% 0%)', 'inset(0% 0% 0% 0%)'] },
          { duration: FILL_MS / 1000, ease: EASE },
        );
        if (cancelled) return;
        await wait(SETTLE_MS);
        if (cancelled) return;

        // 2) 실제 헤더 워드마크 위치로 축소·이동(FLIP). transform-origin은 top-left.
        const wrap = scope.current?.querySelector('[data-intro-wordmark]') as HTMLElement | null;
        const target = document.querySelector<HTMLElement>('[data-site-wordmark]');
        if (wrap && target) {
          const from = wrap.getBoundingClientRect();
          const to = target.getBoundingClientRect();
          const scale = to.height / from.height;
          const tx = to.left - from.left;
          const ty = to.top - from.top;
          await animate(
            wrap,
            { transform: `translate(${tx}px, ${ty}px) scale(${scale})` },
            { duration: MOVE_MS / 1000, ease: EASE },
          );
        }
        if (cancelled) return;

        // 3) 페이지 공개 + 오버레이 페이드아웃 → 실제 헤더로 자연스럽게 넘어감.
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
  }, [shouldPlay, animate, finish, scope]);

  if (removed) return null;

  return (
    <div ref={scope} className={styles.overlay} data-intro-overlay aria-hidden="true">
      <div className={styles.stage}>
        <span className={styles.wordmark} data-intro-wordmark>
          {/* 채워지기 전의 옅은 '빈' 글자 */}
          <span className={styles.base}>raven.kr</span>
          {/* 아래→위로 드러나는 잉크 채움(clip-path로 마스킹) */}
          <span className={styles.fill} data-intro-fill aria-hidden="true">
            raven.kr
          </span>
        </span>
      </div>
    </div>
  );
}
