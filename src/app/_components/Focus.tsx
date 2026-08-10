import { Eyebrow } from '@components/ui/Eyebrow';
import { focus } from '@constants/profile';
import styles from './Focus.module.css';

/* About의 focus를 그대로 쓴다. 앞뒤 섹션이 조밀한 행 목록이라
   여기는 3열 블록으로 골격을 바꿔 같은 리듬이 이어지지 않게 한다. */
export function Focus() {
  return (
    <section className={styles.section}>
      <Eyebrow>어떻게 일하나</Eyebrow>
      <ul className={styles.grid}>
        {focus.map((item) => (
          <li key={item.title} className={styles.item}>
            <h3 className={styles.title}>{item.title}</h3>
            <p className={styles.body}>{item.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
