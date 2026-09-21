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
            {/* 레이블은 링크가 아니다. 같은 줄에 두면 세 번째 링크로 읽힌다. */}
            <nav className={styles.column} aria-label="사이트 내비게이션">
              <Eyebrow as="h2" className={styles.colLabel}>
                둘러보기
              </Eyebrow>
              <div className={styles.columnLinks}>
                <Link className={styles.navItem} href={ROUTES.HOME}>
                  글
                </Link>
                <Link className={styles.navItem} href={ROUTES.ABOUT}>
                  소개
                </Link>
              </div>
            </nav>
          </div>
        </div>
        <div className={styles.bottom}>
          <span>© 2026 raven.kr</span>
          <a href="mailto:dev@raven.kr">문의 · dev@raven.kr</a>
        </div>
      </footer>
    </Container>
  );
}
