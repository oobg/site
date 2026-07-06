'use client';

import { useEffect, useState } from 'react';
import { useAnimate } from 'motion/react';
import { useIntro } from './IntroProvider';
import styles from './SiteIntro.module.css';

const START_DELAY_MS = 350; // 빈 글자를 잠깐 보여준 뒤 채우기 시작
const FILL_MS = 850; // 글자 내부가 좌→우로 차오르는 시간
const SETTLE_MS = 400; // 다 찬 뒤 이동 전 정지(숨)
const MOVE_MS = 450; // 좌상단 헤더 워드마크로 축소·이동
const FADE_MS = 280; // 오버레이 페이드아웃(핸드오프)
// 이동·페이드용 부드러운 ease-out(급가속·bounce 없음).
const EASE = [0.22, 0.61, 0.36, 1] as const;
// 채움용 ease-in-out — 시작이 완만해 "생기자마자 절반" 없이 고르게 차오른다.
const FILL_EASE = [0.65, 0, 0.35, 1] as const;

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
        // 0) 빈 글자를 잠깐 보여준 뒤 시작(초기 스타트 딜레이).
        await wait(START_DELAY_MS);
        if (cancelled) return;

        // 1) 글자 내부가 좌→우로 채워짐(Motion loading-fill-text 방식).
        await animate(
          '[data-intro-fill]',
          { clipPath: ['inset(0% 100% 0% 0%)', 'inset(0% 0% 0% 0%)'] },
          { duration: FILL_MS / 1000, ease: FILL_EASE },
        );
        if (cancelled) return;
        await wait(SETTLE_MS);
        if (cancelled) return;

        // 2) 실제 헤더 워드마크 위치·크기로 축소·이동(FLIP). transform-origin은 top-left.
        //    같은 mono 텍스트라 scale은 '너비 비율'로 잡아야 글자 크기가 정확히 맞고,
        //    line-height 차이로 박스 높이가 다르므로 세로는 '박스 중심'을 맞춘다.
        const wrap = scope.current?.querySelector('[data-intro-wordmark]') as HTMLElement | null;
        const target = document.querySelector<HTMLElement>('[data-site-wordmark]');
        if (wrap && target) {
          const from = wrap.getBoundingClientRect();
          const to = target.getBoundingClientRect();
          const scale = to.width / from.width;
          const tx = to.left - from.left;
          const ty = to.top + to.height / 2 - (from.top + (from.height * scale) / 2);
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
