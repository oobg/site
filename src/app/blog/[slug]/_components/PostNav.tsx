import Link from 'next/link';
import type { PostListItem } from '@features/posts/types/posts.types';
import { ROUTES } from '@constants/routes';
import styles from './PostNav.module.css';

export function PostNav({ prev, next }: { prev: PostListItem | null; next: PostListItem | null }) {
  if (!prev && !next) return null;
  return (
    <nav className={styles.nav}>
      {prev ? (
        <Link href={ROUTES.BLOG.DETAIL(prev.slug)}>
          <span className={styles.label}>이전 글</span>
          {prev.title}
        </Link>
      ) : null}
      {next ? (
        <Link className={styles.next} href={ROUTES.BLOG.DETAIL(next.slug)}>
          <span className={styles.label}>다음 글</span>
          {next.title}
        </Link>
      ) : null}
    </nav>
  );
}
