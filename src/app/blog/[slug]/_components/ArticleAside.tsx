import Link from 'next/link';
import type { Post, PostListItem } from '@features/posts/types/posts.types';
import { ROUTES } from '@constants/routes';
import { formatDateKo } from '@utils/date';
import { ShareButtons } from './ShareButtons';
import styles from './ArticleAside.module.css';

export function ArticleAside({
  post,
  related,
  readingMin,
}: {
  post: Post;
  related: PostListItem[];
  readingMin: number;
}) {
  const category = post.tags[0] ?? null;
  const showUpdated = post.updated_at !== post.published_at;

  return (
    <aside className={styles.aside}>
      <section className={styles.block}>
        <h2 className={styles.blockTitle}>글 정보</h2>
        <dl className={styles.info}>
          <div className={styles.row}>
            <dt>발행</dt>
            <dd>
              <time dateTime={post.published_at}>{formatDateKo(post.published_at)}</time>
            </dd>
          </div>
          {showUpdated ? (
            <div className={styles.row}>
              <dt>수정</dt>
              <dd>
                <time dateTime={post.updated_at}>{formatDateKo(post.updated_at)}</time>
              </dd>
            </div>
          ) : null}
          <div className={styles.row}>
            <dt>읽기 시간</dt>
            <dd>{readingMin}분</dd>
          </div>
          {category ? (
            <div className={styles.row}>
              <dt>카테고리</dt>
              <dd>{category}</dd>
            </div>
          ) : null}
        </dl>
        {post.tags.length > 0 ? (
          <ul className={styles.tags}>
            {post.tags.map((tag) => (
              <li key={tag} className={styles.tag}>
                {tag}
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      {related.length > 0 ? (
        <section className={styles.block}>
          <h2 className={styles.blockTitle}>관련 글</h2>
          <ul className={styles.related}>
            {related.map((item) => (
              <li key={item.slug}>
                <Link href={ROUTES.BLOG.DETAIL(item.slug)} className={styles.relatedItem}>
                  <span className={styles.relatedTitle}>{item.title}</span>
                  <span className={styles.relatedMeta}>
                    <time dateTime={item.published_at}>{formatDateKo(item.published_at)}</time>
                    {item.reading_time_min ? ` · ${item.reading_time_min}분` : ''}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className={`${styles.block} ${styles.shareBlock}`}>
        <h2 className={styles.blockTitle}>공유</h2>
        <ShareButtons title={post.title} />
      </section>
    </aside>
  );
}
