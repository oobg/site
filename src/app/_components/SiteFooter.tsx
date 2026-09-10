import Link from 'next/link';
import { Container } from '@components/layout/Container';
import { Eyebrow } from '@components/ui/Eyebrow';
import { ROUTES } from '@constants/routes';
import styles from './SiteFooter.module.css';

export function SiteFooter() {
  return (
    <Container>
      <footer className={styles.footer}>
        <div className={styles.top}>
          {/* 푸터는 사이트의 성격과 이동할 곳만 짧게 안내한다. */}
          <div>
            <Link className={styles.wordmark} href={ROUTES.HOME}>
              raven.kr
            </Link>
            <p className={styles.tagline}>제품과 소프트웨어를 만들며 남긴 기록이에요.</p>
          </div>
          <div className={styles.columns}>
            <nav className={styles.column} aria-label="사이트 내비게이션">
              <Eyebrow className={styles.colLabel}>둘러보기</Eyebrow>
              <Link href={ROUTES.HOME}>글</Link>
              <Link href={ROUTES.PROJECTS.LIST}>프로젝트</Link>
              <Link href={ROUTES.ABOUT}>소개</Link>
            </nav>
          </div>
        </div>
        <div className={styles.bottom}>
          <span>© 2026 raven.kr</span>
        </div>
      </footer>
    </Container>
  );
}
