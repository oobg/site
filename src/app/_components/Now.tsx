import Link from 'next/link';
import { now } from '@constants/profile';
import { ROUTES } from '@constants/routes';
import styles from './Now.module.css';

/* 랜딩에서 유일하게 고유명사가 들어가는 구간. 회사·제품 이름이 박혀 있어야
   "이 사람이 지금 무엇을 하고 있나"가 구체적으로 읽힌다.
   경력은 About 전용이다 — 여기 요약본을 두면 같은 표가 두 곳에 생긴다. */
export function Now() {
  return (
    <section className={styles.section}>
      <p className={styles.body}>
        <span className={styles.inline}>지금</span>
        {now}{' '}
        <Link className={styles.link} href={ROUTES.ABOUT}>
          더 자세히
        </Link>
      </p>
    </section>
  );
}
