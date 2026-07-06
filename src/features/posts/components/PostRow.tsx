import type { PostListItem } from '@features/posts/types/posts.types';
import { ArrowLink } from '@components/ui/ArrowLink';
import { ROUTES } from '@constants/routes';
import styles from './PostRow.module.css';

function formatDate(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

export function PostRow({ post }: { post: PostListItem }) {
  return (
    <article className={styles.row}>
      <h2 className={styles.title}>{post.title}</h2>
      {post.summary ? <p className={styles.summary}>{post.summary}</p> : null}
      <div className={styles.meta}>
        <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>
        {post.tags.map((tag) => (
          <span key={tag}>#{tag}</span>
        ))}
      </div>
      <div className={styles.footer}>
        <ArrowLink href={ROUTES.BLOG.DETAIL(post.slug)}>Read article</ArrowLink>
      </div>
    </article>
  );
}
