import { Eyebrow } from '@components/ui/Eyebrow';
import styles from './Exploring.module.css';

/* 앞뒤 섹션이 2열 비대칭 그리드라, 여기는 번호를 단 전폭 행 목록으로 골격을 바꾼다.
   3열 아이콘 카드는 어느 사이트에나 붙는 형태여서 의도적으로 쓰지 않는다. */
const ITEMS = [
  {
    title: 'Better Interfaces',
    body: '복잡함을 숨기지 않고 오히려 명료하게 드러내는 인터페이스.',
  },
  {
    title: 'AI & Systems',
    body: '생성 도구를 넘어 사고의 파트너로서의 AI.',
  },
  {
    title: 'Knowledge Infrastructure',
    body: '코드만이 아니라 사고를 확장하는 시스템 만들기.',
  },
];

export function Exploring() {
  return (
    <section className={styles.section}>
      <Eyebrow>요즘 파고 있는 것</Eyebrow>
      <ol className={styles.list}>
        {ITEMS.map(({ title, body }, i) => (
          <li key={title} className={styles.item}>
            <span className={styles.index} aria-hidden>
              {String(i + 1).padStart(2, '0')}
            </span>
            <h3 className={styles.title}>{title}</h3>
            <p className={styles.body}>{body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
