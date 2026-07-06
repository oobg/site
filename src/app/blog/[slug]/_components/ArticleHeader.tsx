import type { Post } from '@features/posts/types/posts.types';
import { computeReadingTime } from '@lib/markdown/reading-time';
import styles from './ArticleHeader.module.css';

function formatDate(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

export function ArticleHeader({ post }: { post: Post }) {
  const readingMin = post.reading_time_min ?? computeReadingTime(post.body_markdown);
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>{post.title}</h1>
      <div className={styles.meta}>
        <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>
        <span>{readingMin}분</span>
        {post.tags.map((tag) => (
          <span key={tag}>#{tag}</span>
        ))}
      </div>
    </header>
  );
}
