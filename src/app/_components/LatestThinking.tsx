import type { PostListItem } from '@features/posts/types/posts.types';
import { ArrowLink } from '@components/ui/ArrowLink';
import { ROUTES } from '@constants/routes';
import styles from './LatestThinking.module.css';

export function LatestThinking({ post }: { post: PostListItem | null }) {
  if (!post) return null;
  return (
    <section className={styles.section}>
      <p className={styles.label}>Latest thinking</p>
      <h2 className={styles.title}>{post.title}</h2>
      <ArrowLink href={ROUTES.BLOG.DETAIL(post.slug)}>Read article</ArrowLink>
    </section>
  );
}
