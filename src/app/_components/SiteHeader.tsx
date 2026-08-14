'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Container } from '@components/layout/Container';
import { ROUTES } from '@constants/routes';
import styles from './SiteHeader.module.css';

export function SiteHeader() {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLElement>(null);
  const rafRef = useRef(0);
  const [stuck, setStuck] = useState(false);

  /* 스크롤 이벤트 대신 감시자 하나를 관찰한다. 스크롤마다 콜백이 도는 구조를 피한다. */
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(([entry]) => setStuck(!entry.isIntersecting));
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  /* 스페큘러는 포인터를 따라간다. 자동으로 반짝이면 장식이 되고, 손을 따라오면 재질이 된다.
     포인터가 없는 기기와 모션 감축 설정에서는 가운데 고정. */
  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLElement>) => {
    const pill = pillRef.current;
    if (!pill || event.pointerType !== 'mouse') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (rafRef.current) return;
    const { clientX } = event;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      const rect = pill.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      pill.style.setProperty('--sweep', `${(ratio * 100).toFixed(1)}%`);
    });
  }, []);

  const handlePointerLeave = useCallback(() => {
    pillRef.current?.style.removeProperty('--sweep');
  }, []);

  return (
    <>
      <div ref={sentinelRef} className={styles.sentinel} aria-hidden="true" />
      <header className={styles.header} data-stuck={stuck || undefined}>
        <Container>
          <nav
            ref={pillRef}
            className={styles.pill}
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
          >
            <Link href={ROUTES.HOME} className={styles.wordmark} data-site-wordmark>
              raven.kr
            </Link>
            <div className={styles.links}>
              <Link href={ROUTES.BLOG.LIST}>글</Link>
              <Link href={ROUTES.PROJECTS.LIST}>프로젝트</Link>
              <Link href={ROUTES.ABOUT}>About</Link>
            </div>
          </nav>
        </Container>
      </header>
    </>
  );
}
