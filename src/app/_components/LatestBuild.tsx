import type { ProjectListItem } from '@features/projects/types/projects.types';
import { ArrowLink } from '@components/ui/ArrowLink';
import { Eyebrow } from '@components/ui/Eyebrow';
import { ROUTES } from '@constants/routes';
import styles from './LatestBuild.module.css';

/* LatestWork 2열 중 오른쪽 열. 섹션 껍데기는 부모가 갖는다. */
export function LatestBuild({ project }: { project: ProjectListItem | null }) {
  if (!project) return null;
  const cover = project.cover_image_url;
  return (
    <article className={styles.column}>
      <Eyebrow>최근에 만든 것</Eyebrow>
      {cover ? (
        <img className={styles.image} src={cover} alt="" width={920} height={560} loading="lazy" />
      ) : null}
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
    </article>
  );
}
