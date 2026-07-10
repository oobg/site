import { ArrowLink } from '@components/ui/ArrowLink';
import { ROUTES } from '@constants/routes';
import styles from './AboutTeaser.module.css';

/* 홈 서사를 닫는 소개/연결 섹션: 추상 테마(Exploring) → 사람 → About.
   문구는 About lead의 축약으로 단일 출처를 유지한다. */
export function AboutTeaser() {
  return (
    <section className={styles.section}>
      <p className={styles.label}>Who&rsquo;s behind this</p>
      <p className={styles.statement}>
        생각을 다듬고, 그것을 시스템과 제품으로 옮기는 과정을 기록합니다.
      </p>
      <ArrowLink href={ROUTES.ABOUT}>More about me</ArrowLink>
    </section>
  );
}
