import Link from 'next/link';
import { Container } from '@components/layout/Container';
import { ROUTES } from '@constants/routes';
import styles from './SiteFooter.module.css';

export function SiteFooter() {
  return (
    <Container>
      <footer className={styles.footer}>
        <div className={styles.top}>
          <p className={styles.statement}>
            생각을 시스템으로.
            <br />
            시스템을 제품으로.
            <br />
            배운 것을 기록으로.
          </p>
          <div className={styles.columns}>
            <nav className={styles.column} aria-label="사이트 내비게이션">
              <p className={styles.colLabel}>Navigation</p>
              <Link href={ROUTES.BLOG.LIST}>글</Link>
              <Link href={ROUTES.PROJECTS.LIST}>프로젝트</Link>
              <Link href={ROUTES.ABOUT}>About</Link>
            </nav>
            <div className={styles.column}>
              <p className={styles.colLabel}>Connect</p>
              <a href="https://github.com/oobg">GitHub</a>
              <a href="https://api.raven.kr">API</a>
            </div>
          </div>
        </div>
        <div className={styles.bottom}>
          <span>© 2026 raven.kr</span>
          <span>Built with Next.js · TypeScript</span>
        </div>
      </footer>
    </Container>
  );
}
