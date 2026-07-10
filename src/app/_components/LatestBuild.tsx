import type { ProjectListItem } from '@features/projects/types/projects.types';
import { ArrowLink } from '@components/ui/ArrowLink';
import { ROUTES } from '@constants/routes';
import styles from './LatestBuild.module.css';

export function LatestBuild({ project }: { project: ProjectListItem | null }) {
  if (!project) return null;
  const cover = project.cover_image_url;
  return (
    <section className={cover ? styles.section : `${styles.section} ${styles.noMedia}`}>
      <div className={styles.text}>
        <p className={styles.label}>Latest build</p>
        <h2 className={styles.title}>{project.title}</h2>
        {project.summary ? <p className={styles.summary}>{project.summary}</p> : null}
        {project.tags.length > 0 ? (
          <ul className={styles.tags}>
            {project.tags.map((tag) => (
              <li key={tag} className={styles.tag}>
                {tag}
              </li>
            ))}
          </ul>
        ) : null}
        <ArrowLink href={ROUTES.PROJECTS.DETAIL(project.slug)}>View project</ArrowLink>
      </div>
      {cover ? (
        <div className={styles.media}>
          <img
            className={styles.image}
            src={cover}
            alt=""
            width={920}
            height={560}
            loading="lazy"
          />
        </div>
      ) : null}
    </section>
  );
}
