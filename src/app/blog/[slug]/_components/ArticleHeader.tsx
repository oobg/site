import Link from 'next/link';
import type { BlogPost } from '@features/posts/types/posts.types';
import { homeSearchHref } from '@constants/routes';
import { SITE } from '@constants/site';
import { formatDateKo } from '@utils/date';
import styles from './ArticleHeader.module.css';

export function ArticleHeader({ post, readingMin }: { post: BlogPost; readingMin: number }) {
  const { author } = SITE;
  return (
    <header className={styles.header}>
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
      ) : null}
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
      <ul className={styles.tags}>
        <li>
          <Link href={homeSearchHref({ category: post.category.slug })}>{post.category.name}</Link>
        </li>
        {post.tags.map((tag) => (
          <li key={tag}>
            <Link href={homeSearchHref({ tag })}>{tag}</Link>
          </li>
        ))}
      </ul>
    </header>
  );
}
