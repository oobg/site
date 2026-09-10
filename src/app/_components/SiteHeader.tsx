'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Dialog } from '@base-ui/react/dialog';
import { Container } from '@components/layout/Container';
import { ROUTES } from '@constants/routes';
import styles from './SiteHeader.module.css';
const links = [
  { href: ROUTES.ABOUT, label: '소개' },
  { href: ROUTES.PROJECTS.LIST, label: '프로젝트' },
  { href: '/#archive-title', label: '검색' },
];
export function SiteHeader() {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(([entry]) => setStuck(!entry.isIntersecting));
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);
  return (
    <>
      <div ref={sentinelRef} className={styles.sentinel} aria-hidden="true" />
      <header className={styles.header} data-stuck={stuck || undefined}>
        <Container>
          <nav className={styles.nav} aria-label="주요 내비게이션">
            <Link href={ROUTES.HOME} className={styles.wordmark}>
              raven
            </Link>
            <div className={styles.links}>
              {links.map((link) => (
                <Link key={link.href} href={link.href}>
                  {link.label}
                </Link>
              ))}
            </div>
            <Dialog.Root>
              <Dialog.Trigger className={styles.menuButton} aria-label="메뉴 열기">
                <span />
                <span />
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Backdrop className={styles.backdrop} />
                <Dialog.Popup className={styles.menu}>
                  <Dialog.Title className={styles.menuTitle}>메뉴</Dialog.Title>
                  <div className={styles.menuLinks}>
                    {links.map((link) => (
                      <Dialog.Close
                        key={link.href}
                        nativeButton={false}
                        render={<Link href={link.href} />}
                      >
                        {link.label}
                      </Dialog.Close>
                    ))}
                  </div>
                  <Dialog.Close className={styles.close} aria-label="메뉴 닫기">
                    ×
                  </Dialog.Close>
                </Dialog.Popup>
              </Dialog.Portal>
            </Dialog.Root>
          </nav>
        </Container>
      </header>
    </>
  );
}
