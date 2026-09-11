import Link from 'next/link';
import type { ProjectListItem } from '@features/projects/types/projects.types';
import { ROUTES } from '@constants/routes';
import styles from './LatestBuild.module.css';

/** 최근 작업 한 건을 홈의 다른 반복 목록과 분리해 보여 준다. */
export function LatestBuild({ project }: { project: ProjectListItem | null }) {
  if (!project) return null;
  return (
    <section className={styles.section}>
      <p className={styles.label}>만들고 있는 것</p>
      <Link className={styles.item} href={ROUTES.PROJECTS.DETAIL(project.slug)}>
        <div className={styles.copy}>
          <h2 className={styles.title}>{project.title}</h2>
          {project.summary ? <p className={styles.desc}>{project.summary}</p> : null}
        </div>
        <div className={styles.meta}>
          {project.tags.length > 0 ? (
            <p className={styles.stack}>{project.tags.join(' · ')}</p>
          ) : null}
          <span className={styles.open} aria-hidden>
            열기
          </span>
        </div>
      </Link>
    </section>
  );
}
