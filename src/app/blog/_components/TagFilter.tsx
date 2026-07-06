import Link from 'next/link';
import { ROUTES } from '@constants/routes';
import styles from './TagFilter.module.css';

export function TagFilter({ tags, active }: { tags: string[]; active?: string }) {
  return (
    <nav className={styles.filter}>
      <Link
        href={ROUTES.BLOG.LIST}
        className={active ? styles.chip : styles.active}
        aria-current={active ? undefined : 'true'}
      >
        전체
      </Link>
      {tags.map((tag) => {
        const isActive = tag === active;
        return (
          <Link
            key={tag}
            href={`${ROUTES.BLOG.LIST}?tag=${encodeURIComponent(tag)}`}
            className={isActive ? styles.active : styles.chip}
            aria-current={isActive ? 'true' : undefined}
          >
            #{tag}
          </Link>
        );
      })}
    </nav>
  );
}
