import Link from 'next/link';
import type { ProjectListItem } from '@features/projects/types/projects.types';
import { ROUTES } from '@constants/routes';
import styles from './ProjectCard.module.css';

export function ProjectCard({ project }: { project: ProjectListItem }) {
  return (
    <Link href={ROUTES.PROJECTS.DETAIL(project.slug)} className={styles.card}>
      {/* 커버가 없으면 이미지 영역 자체를 두지 않는다.
          빈 회색 블록은 있지도 않은 콘텐츠가 있는 것처럼 보이게 한다.

          next/image를 쓰지 않는 이유는 ArticleHeader와 같다 — 커버 URL은 콘텐츠 API가
          주는 값이라 호스트를 미리 알 수 없는데, next/image는 next.config.ts의
          remotePatterns에 없는 호스트를 400으로 막는다. 못 나오는 것보다 최적화를 못 받는
          편이 낫다. 커버 호스트가 한곳으로 확정되면 셋을 함께 바꾼다. */}
      {project.cover_image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className={styles.cover}
          src={project.cover_image_url}
          alt={project.title}
          loading="lazy"
        />
      ) : null}
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
