import type { Post } from '@features/posts/types/posts.types';
import styles from './ArticleHeader.module.css';

function formatDate(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

export function ArticleHeader({ post }: { post: Post }) {
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>{post.title}</h1>
      <div className={styles.meta}>
        <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>
        {post.reading_time_min ? <span>{post.reading_time_min}분</span> : null}
        {post.tags.map((tag) => (
          <span key={tag}>#{tag}</span>
        ))}
      </div>
    </header>
  );
}
