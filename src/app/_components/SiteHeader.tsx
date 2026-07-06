import Link from 'next/link';
import { Container } from '@components/layout/Container';
import { ROUTES } from '@constants/routes';
import styles from './SiteHeader.module.css';

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <Container>
        <nav className={styles.nav}>
          <Link href={ROUTES.HOME} className={styles.wordmark} data-site-wordmark>
            raven.kr
          </Link>
          <div className={styles.links}>
            <Link href={ROUTES.BLOG.LIST}>글</Link>
            <Link href={ROUTES.PROJECTS.LIST}>프로젝트</Link>
          </div>
        </nav>
      </Container>
    </header>
  );
}
