'use client';

import { useEffect, useState } from 'react';
import type { TocEntry } from '@lib/markdown/toc.types';
import { Eyebrow } from '@components/ui/Eyebrow';
import styles from './TableOfContents.module.css';

export function TableOfContents({ toc }: { toc: TocEntry[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  /**
   * 지금 읽고 있는 제목을 위치로 직접 고른다.
   *
   * 전에는 IntersectionObserver로 상단 30% 밴드를 관찰했는데, 밴드를 건너뛰는
   * 이동에서는 교차 상태가 false에서 false로 갈 뿐이라 콜백이 아예 오지 않았다.
   * 목차 링크로 점프하거나 트랙패드로 크게 튕기면 표시가 죽는다. 관찰한 것 중
   * 첫 번째를 쓰던 것도 문제였다 — entries 순서는 문서 순서가 아니라서 제목 둘이
   * 동시에 걸리면 아래 것이 잡힐 수 있다.
   *
   * 기준선보다 위에 있는 제목 중 마지막 것이 지금 읽는 제목이다. 어디로 뛰든
   * 그 순간의 위치만 보면 답이 나온다.
   */
  useEffect(() => {
    if (toc.length === 0) return;
    const headings = toc
      .map((entry) => document.getElementById(entry.id))
      .filter((el): el is HTMLElement => el !== null);
    if (headings.length === 0) return;

    let raf = 0;
    const compute = () => {
      raf = 0;
      const line = window.innerHeight * 0.3;
      /* 첫 제목에 아직 닿지 않았으면 아무것도 표시하지 않는다 —
         리드 문단을 읽는 중에 목차가 켜져 있으면 위치를 잘못 알린다. */
      if (headings[0].getBoundingClientRect().top > line) {
        setActiveId(null);
        return;
      }
      let current = headings[0].id;
      for (const el of headings) {
        if (el.getBoundingClientRect().top > line) break;
        current = el.id;
      }
      setActiveId(current);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(compute);
    };

    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      cancelAnimationFrame(raf);
    };
  }, [toc]);

  if (toc.length === 0) return null;

  return (
    /* 바깥은 본문 높이만큼의 빈 기둥이고, 안쪽이 sticky로 따라온다.
       viewport에 fixed로 붙이면 본문이 끝난 뒤에도 목차가 남는다. */
    <details className={styles.toc} open>
      <summary className={styles.summary}>목차</summary>
      <nav className={styles.inner} aria-label="목차">
        <Eyebrow className={styles.label}>목차</Eyebrow>
        <ul className={styles.list}>
          {toc.map((entry) => (
            <li key={entry.id}>
              <a
                href={`#${entry.id}`}
                className={`${styles.item} ${entry.depth === 3 ? styles.depth3 : ''} ${
                  activeId === entry.id ? styles.active : ''
                }`}
              >
                {entry.text}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </details>
  );
}
