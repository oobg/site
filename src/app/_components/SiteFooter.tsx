import { Container } from '@components/layout/Container';
import styles from './SiteFooter.module.css';

export function SiteFooter() {
  return (
    <Container>
      <footer className={styles.footer}>
        <a href="https://github.com/oobg">GitHub</a>
        <a href="https://api.raven.kr">API</a>
      </footer>
    </Container>
  );
}
