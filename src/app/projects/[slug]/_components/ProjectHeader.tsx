import type { Project } from '@features/projects/types/projects.types';
import styles from './ProjectHeader.module.css';

function formatDate(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function safeLink(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.trim() === '') return undefined;
  try {
    const url = new URL(value, 'https://raven.invalid');
    return url.protocol === 'http:' || url.protocol === 'https:' ? value : undefined;
  } catch {
    return undefined;
  }
}

export function ProjectHeader({ project }: { project: Project }) {
  const fm = record(project.frontmatter);
  const role = typeof fm.role === 'string' ? fm.role : undefined;
  const period = typeof fm.period === 'string' ? fm.period : undefined;
  const stack = Array.isArray(fm.stack)
    ? fm.stack.filter((value): value is string => typeof value === 'string')
    : [];
  const links = record(fm.links);
  const repo = safeLink(links.repo);
  const live = safeLink(links.live);

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
        {role ? (
          <div className={styles.row}>
            <dt className={styles.label}>Role</dt>
            <dd>{role}</dd>
          </div>
        ) : null}
        {period ? (
          <div className={styles.row}>
            <dt className={styles.label}>Period</dt>
            <dd>{period}</dd>
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
