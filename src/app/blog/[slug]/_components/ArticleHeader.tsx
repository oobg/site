import Link from 'next/link';
import type { Post } from '@features/posts/types/posts.types';
import { ROUTES } from '@constants/routes';
import { SITE } from '@constants/site';
import { formatDateKo } from '@utils/date';
import styles from './ArticleHeader.module.css';

export function ArticleHeader({ post, readingMin }: { post: Post; readingMin: number }) {
  const category = post.tags[0] ?? null;
  const { author } = SITE;
  return (
    <header className={styles.header}>
      <Link href={ROUTES.BLOG.LIST} className={styles.back}>
        ← 글 목록
      </Link>
      {category ? <p className={styles.eyebrow}>{category}</p> : null}
      <h1 className={styles.title}>{post.title}</h1>
      {post.summary ? <p className={styles.summary}>{post.summary}</p> : null}
      <div className={styles.byline}>
        <span className={styles.avatar} aria-hidden="true">
          {author.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={author.avatarUrl} alt="" className={styles.avatarImg} />
          ) : (
            author.initials
          )}
        </span>
        <span className={styles.bylineText}>
          <span className={styles.author}>{author.name}</span>
          <span className={styles.bylineMeta}>
            <time dateTime={post.published_at}>{formatDateKo(post.published_at)}</time>
            {` · ${readingMin}분 읽기`}
          </span>
        </span>
      </div>
      {post.cover_image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.cover_image_url} alt="" className={styles.cover} />
      ) : null}
    </header>
  );
}
