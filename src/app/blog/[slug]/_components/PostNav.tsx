import Link from 'next/link';
import type { PostListItem } from '@features/posts/types/posts.types';
import { DEFAULT_POST_CATEGORY_SLUG } from '@features/posts/types/posts.types';
import { ROUTES } from '@constants/routes';
import styles from './PostNav.module.css';

export function PostNav({ prev, next }: { prev: PostListItem | null; next: PostListItem | null }) {
  if (!prev && !next) return null;
  return (
    <nav className={styles.nav} aria-label="이전·다음 글">
      <div className={styles.top}>
        <Link href={ROUTES.BLOG.LIST} className={styles.index}>
          글 목록
        </Link>
      </div>
      <div className={styles.cards} data-single={!prev || !next ? '' : undefined}>
        {prev ? (
          <Link
            href={ROUTES.BLOG.DETAIL(prev.category?.slug ?? DEFAULT_POST_CATEGORY_SLUG, prev.slug)}
            className={styles.card}
            data-track-event="related_article_open"
            data-track-source="previous"
          >
            <span className={styles.label}>← 이전 글</span>
            <span className={styles.cardTitle}>{prev.title}</span>
          </Link>
        ) : null}
        {next ? (
          <Link
            href={ROUTES.BLOG.DETAIL(next.category?.slug ?? DEFAULT_POST_CATEGORY_SLUG, next.slug)}
            className={`${styles.card} ${styles.next}`}
            data-track-event="related_article_open"
            data-track-source="next"
          >
            <span className={styles.label}>다음 글 →</span>
            <span className={styles.cardTitle}>{next.title}</span>
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
