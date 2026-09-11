import Link from 'next/link';
import type { BlogPostSummary } from '@features/posts/types/posts.types';
import { ROUTES } from '@constants/routes';
import styles from './PostCard.module.css';

export function PostCard({
  post,
  reserveCoverSpace = false,
  showCategory = true,
  variant = 'default',
}: {
  post: BlogPostSummary;
  reserveCoverSpace?: boolean;
  showCategory?: boolean;
  variant?: 'default' | 'compact';
}) {
  const hasCover = Boolean(post.cover_image_url || reserveCoverSpace);
  return (
    <article
      className={variant === 'compact' ? `${styles.card} ${styles.compact}` : styles.card}
      data-has-cover={hasCover || undefined}
    >
      {post.cover_image_url && (
        <Link
          className={styles.cover}
          href={ROUTES.BLOG.DETAIL(post.category.slug, post.slug)}
          tabIndex={-1}
          aria-hidden="true"
        >
          <img
            src={post.cover_image_url}
            alt=""
            style={{
              objectPosition: `${post.cover_position.x * 100}% ${post.cover_position.y * 100}%`,
            }}
          />
        </Link>
      )}
      {!post.cover_image_url && reserveCoverSpace ? (
        <div className={`${styles.cover} ${styles.coverFallback}`} aria-hidden="true">
          <span aria-hidden>Raven</span>
        </div>
      ) : null}
      <div className={styles.body}>
        {showCategory ? <span className={styles.category}>{post.category.name}</span> : null}
        <h2>
          <Link href={ROUTES.BLOG.DETAIL(post.category.slug, post.slug)}>{post.title}</Link>
        </h2>
        {post.summary && <p>{post.summary}</p>}
        <time dateTime={post.published_at}>
          {new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' }).format(
            new Date(post.published_at),
          )}
        </time>
      </div>
    </article>
  );
}
