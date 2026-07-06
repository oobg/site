import Link from 'next/link';
import type { ProjectListItem } from '@features/projects/types/projects.types';
import { ROUTES } from '@constants/routes';
import styles from './ProjectCard.module.css';

export function ProjectCard({ project }: { project: ProjectListItem }) {
  return (
    <Link href={ROUTES.PROJECTS.DETAIL(project.slug)} className={styles.card}>
      {project.cover_image_url ? (
        <img
          className={styles.cover}
          src={project.cover_image_url}
          alt={project.title}
          loading="lazy"
        />
      ) : (
        <div className={styles.coverPlaceholder} aria-hidden />
      )}
      <div className={styles.body}>
        <h2 className={styles.title}>{project.title}</h2>
        {project.summary ? <p className={styles.summary}>{project.summary}</p> : null}
        {project.tags.length > 0 ? (
          <div className={styles.tags}>
            {project.tags.map((tag) => (
              <span key={tag}>#{tag}</span>
            ))}
          </div>
        ) : null}
      </div>
    </Link>
  );
}
