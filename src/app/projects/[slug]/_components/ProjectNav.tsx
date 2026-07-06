import Link from 'next/link';
import type { ProjectListItem } from '@features/projects/types/projects.types';
import { ROUTES } from '@constants/routes';
import styles from './ProjectNav.module.css';

export function ProjectNav({
  prev,
  next,
}: {
  prev: ProjectListItem | null;
  next: ProjectListItem | null;
}) {
  if (!prev && !next) return null;
  return (
    <nav className={styles.nav}>
      {prev ? (
        <Link href={ROUTES.PROJECTS.DETAIL(prev.slug)}>
          <span className={styles.label}>이전 프로젝트</span>
          {prev.title}
        </Link>
      ) : null}
      {next ? (
        <Link className={styles.next} href={ROUTES.PROJECTS.DETAIL(next.slug)}>
          <span className={styles.label}>다음 프로젝트</span>
          {next.title}
        </Link>
      ) : null}
    </nav>
  );
}
