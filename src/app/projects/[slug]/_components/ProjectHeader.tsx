import type { Project, ProjectFrontmatter } from '@features/projects/types/projects.types';
import styles from './ProjectHeader.module.css';

function formatDate(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

export function ProjectHeader({ project }: { project: Project }) {
  const fm = project.frontmatter as ProjectFrontmatter;
  const stack = fm.stack ?? [];
  const repo = fm.links?.repo;
  const live = fm.links?.live;

  return (
    <header className={styles.header}>
      <h1 className={styles.title}>{project.title}</h1>
      <dl className={styles.meta}>
        <div className={styles.row}>
          <dt className={styles.label}>Date</dt>
          <dd>
            <time dateTime={project.published_at}>{formatDate(project.published_at)}</time>
          </dd>
        </div>
        {fm.role ? (
          <div className={styles.row}>
            <dt className={styles.label}>Role</dt>
            <dd>{fm.role}</dd>
          </div>
        ) : null}
        {fm.period ? (
          <div className={styles.row}>
            <dt className={styles.label}>Period</dt>
            <dd>{fm.period}</dd>
          </div>
        ) : null}
        {stack.length > 0 ? (
          <div className={styles.row}>
            <dt className={styles.label}>Stack</dt>
            <dd className={styles.stack}>
              {stack.map((s) => (
                <span key={s} className={styles.chip}>
                  {s}
                </span>
              ))}
            </dd>
          </div>
        ) : null}
        {repo || live ? (
          <div className={styles.row}>
            <dt className={styles.label}>Links</dt>
            <dd className={styles.links}>
              {repo ? (
                <a href={repo} target="_blank" rel="noreferrer">
                  Repo
                </a>
              ) : null}
              {live ? (
                <a href={live} target="_blank" rel="noreferrer">
                  Live
                </a>
              ) : null}
            </dd>
          </div>
        ) : null}
      </dl>
    </header>
  );
}
