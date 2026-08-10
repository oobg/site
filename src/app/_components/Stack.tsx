import { Eyebrow } from '@components/ui/Eyebrow';
import { stack } from '@constants/profile';
import styles from './Stack.module.css';

/* 스택은 경력이 아니라 '무엇으로 만드는가'라서 랜딩에 둔다.
   About의 경력표와 겹치지 않고, 목록이라 밀도를 싸게 얻는다. */
export function Stack() {
  return (
    <section className={styles.section}>
      <Eyebrow>주로 쓰는 것</Eyebrow>
      <ul className={styles.list}>
        {stack.map((item) => (
          <li key={item} className={styles.item}>
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
