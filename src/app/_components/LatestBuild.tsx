import type { ProjectListItem } from '@features/projects/types/projects.types';
import { ArrowLink } from '@components/ui/ArrowLink';
import { Eyebrow } from '@components/ui/Eyebrow';
import { ROUTES } from '@constants/routes';
import styles from './LatestBuild.module.css';

/* 프로젝트는 글과 달리 편수가 적어 목록보다 한 건을 세우는 쪽이 맞다.
   커버가 없으면 이미지 자리를 두지 않는다(가짜 플레이스홀더 금지). */
export function LatestBuild({ project }: { project: ProjectListItem | null }) {
  if (!project) return null;
  const cover = project.cover_image_url;
  return (
    <section className={styles.section}>
      <Eyebrow>최근에 만든 것</Eyebrow>
      <div className={styles.card}>
        {cover ? (
          <img
            className={styles.image}
            src={cover}
            alt=""
            width={920}
            height={560}
            loading="lazy"
          />
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
      </div>
    </section>
  );
}
