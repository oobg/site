import Link from 'next/link';
import type { ProjectListItem } from '@features/projects/types/projects.types';
import { ROUTES } from '@constants/routes';
import styles from './LatestBuild.module.css';

/**
 * 만들고 있는 것. 카드도 표지도 쓰지 않는다.
 *
 * 한 건뿐이라 면에 담을 이유가 없고, 면을 주면 앞의 글 목록과 같은 리듬으로 읽혀
 * 아래가 평평해진다. 좌측 accent 레일도 쓰지 않는다 — 흔한 패턴인 데다 글 목록의
 * hover가 이미 같은 기호를 쓰고 있어 뜻이 겹친다. 크기 차이 하나로 세운다.
 */
export function LatestBuild({ project }: { project: ProjectListItem | null }) {
  if (!project) return null;
  return (
    <section className={styles.section}>
      <p className={styles.label}>만들고 있는 것</p>
      <Link className={styles.item} href={ROUTES.PROJECTS.DETAIL(project.slug)}>
        <h2 className={styles.title}>{project.title}</h2>
        {project.summary ? <p className={styles.desc}>{project.summary}</p> : null}
        {project.tags.length > 0 ? (
          <p className={styles.stack}>{project.tags.join(' · ')}</p>
        ) : null}
      </Link>
    </section>
  );
}
