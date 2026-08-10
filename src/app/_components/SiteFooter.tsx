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
          {/* 사이트의 명제는 홈 히어로가 정본이다. 푸터는 "여기가 어디이고 어디로 갈 수 있나"만 맡는다.
              워드마크를 크게 두는 건 진입 인트로가 이 글자를 헤더로 넘기는 안무와 짝을 맞추기 위함이다. */}
          <div>
            <p className={styles.wordmark}>raven.kr</p>
            <p className={styles.tagline}>배윤석의 글과 프로젝트 기록.</p>
          </div>
          <div className={styles.columns}>
            <nav className={styles.column} aria-label="사이트 내비게이션">
              <Eyebrow className={styles.colLabel}>Navigation</Eyebrow>
              <Link href={ROUTES.BLOG.LIST}>글</Link>
              <Link href={ROUTES.PROJECTS.LIST}>프로젝트</Link>
              <Link href={ROUTES.ABOUT}>About</Link>
            </nav>
            <div className={styles.column}>
              <Eyebrow className={styles.colLabel}>Connect</Eyebrow>
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
