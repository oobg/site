import { ArrowsClockwise, Cube, Target } from '@phosphor-icons/react/dist/ssr';
import styles from './Exploring.module.css';

const ITEMS = [
  {
    Icon: Target,
    title: 'Better Interfaces',
    body: '복잡함을 숨기지 않고 오히려 명료하게 드러내는 인터페이스.',
  },
  {
    Icon: Cube,
    title: 'AI & Systems',
    body: '생성 도구를 넘어 사고의 파트너로서의 AI.',
  },
  {
    Icon: ArrowsClockwise,
    title: 'Knowledge Infrastructure',
    body: '코드만이 아니라 사고를 확장하는 시스템 만들기.',
  },
];

export function Exploring() {
  return (
    <section className={styles.section}>
      <p className={styles.label}>What I&rsquo;m exploring</p>
      <ul className={styles.grid}>
        {ITEMS.map(({ Icon, title, body }) => (
          <li key={title} className={styles.item}>
            <Icon size={28} weight="light" aria-hidden />
            <h3 className={styles.title}>{title}</h3>
            <p className={styles.body}>{body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
