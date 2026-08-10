import { ArrowLink } from '@components/ui/ArrowLink';
import { Eyebrow } from '@components/ui/Eyebrow';
import { ROUTES } from '@constants/routes';
import styles from './AboutTeaser.module.css';

/* 홈 서사를 닫는 소개/연결 섹션: 추상 테마(Exploring) → 사람 → About.
   사이트의 명제는 히어로가 정본이므로 여기서는 반복하지 않고 '누가 쓰는가'만 말한다.
   문구는 About lead의 축약으로 단일 출처를 유지한다.
   앞 섹션들이 열로 나뉘므로 여기는 열 없이 전폭 한 덩어리로 둔다. */
export function AboutTeaser() {
  return (
    <section className={styles.section}>
      <Eyebrow>Who&rsquo;s behind this</Eyebrow>
      <p className={styles.statement}>사용자 경험을 고민하는 프론트엔드 개발자, 배윤석입니다.</p>
      <ArrowLink href={ROUTES.ABOUT}>More about me</ArrowLink>
    </section>
  );
}
