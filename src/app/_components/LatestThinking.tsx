import type { PostListItem } from '@features/posts/types/posts.types';
import { ArrowLink } from '@components/ui/ArrowLink';
import { ROUTES } from '@constants/routes';
import { formatDateKo } from '@utils/date';
import styles from './LatestThinking.module.css';

export function LatestThinking({ post }: { post: PostListItem | null }) {
  if (!post) return null;
  const cover = post.cover_image_url;
  return (
    <section className={cover ? styles.section : `${styles.section} ${styles.noMedia}`}>
      <div className={styles.text}>
        <p className={styles.label}>Latest thinking</p>
        <h2 className={styles.title}>{post.title}</h2>
        {post.summary ? <p className={styles.summary}>{post.summary}</p> : null}
        <div className={styles.meta}>
          {typeof post.reading_time_min === 'number' ? (
            <span>{post.reading_time_min}분 읽기</span>
          ) : null}
          <time dateTime={post.published_at}>{formatDateKo(post.published_at)}</time>
        </div>
        <ArrowLink href={ROUTES.BLOG.DETAIL(post.slug)}>Read article</ArrowLink>
      </div>
      {cover ? (
        <div className={styles.media}>
          <img
            className={styles.image}
            src={cover}
            alt=""
            width={880}
            height={560}
            loading="lazy"
          />
        </div>
      ) : null}
    </section>
  );
}
