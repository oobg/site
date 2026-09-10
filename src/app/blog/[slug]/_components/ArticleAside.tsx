import Link from 'next/link';
import type { BlogPost, PostListItem } from '@features/posts/types/posts.types';
import { Eyebrow } from '@components/ui/Eyebrow';
import { ROUTES } from '@constants/routes';
import { SITE } from '@constants/site';
import { formatDateKo } from '@utils/date';
import styles from './ArticleAside.module.css';

export function ArticleAside({
  post,
  related,
  readingMin,
}: {
  post: BlogPost;
  related: PostListItem[];
  readingMin: number;
}) {
  const showUpdated = post.updated_at !== post.published_at;

  return (
    <aside className={styles.aside}>
      <section className={styles.block}>
        <Eyebrow as="h2" className={styles.blockTitle}>
          글 정보
        </Eyebrow>
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
          <div className={styles.row}>
            <dt>카테고리</dt>
            <dd>{post.category.name}</dd>
          </div>
        </dl>
      </section>

      <section className={styles.authorBlock}>
        <Eyebrow as="h2" className={styles.blockTitle}>
          쓴 사람
        </Eyebrow>
        <p>
          <strong>{SITE.author.name}</strong>
        </p>
        <p className={styles.authorDescription}>제품과 소프트웨어를 만들며 배운 것을 기록해요.</p>
      </section>

      {related.length > 0 ? (
        <section className={styles.block}>
          <Eyebrow as="h2" className={styles.blockTitle}>
            관련 글
          </Eyebrow>
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
    </aside>
  );
}
