import Link from 'next/link';
import type { BlogPost } from '@features/posts/types/posts.types';
import { Eyebrow } from '@components/ui/Eyebrow';
import { ROUTES } from '@constants/routes';
import { SITE } from '@constants/site';
import { formatDateKo } from '@utils/date';
import styles from './ArticleHeader.module.css';

export function ArticleHeader({ post, readingMin }: { post: BlogPost; readingMin: number }) {
  const { author } = SITE;
  return (
    <header className={styles.header}>
      <Link href={ROUTES.HOME} className={styles.back}>
        ← 글 목록
      </Link>
      <Eyebrow className={styles.eyebrow}>{post.category.name}</Eyebrow>
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
        <img
          src={post.cover_image_url}
          alt={post.cover_alt ?? ''}
          className={styles.cover}
          style={{
            objectPosition: `${post.cover_position.x * 100}% ${post.cover_position.y * 100}%`,
          }}
        />
      ) : (
        <div className={styles.coverFallback} aria-hidden="true">
          <span>raven.kr</span>
          <strong>{post.category.name}</strong>
        </div>
      )}
    </header>
  );
}
