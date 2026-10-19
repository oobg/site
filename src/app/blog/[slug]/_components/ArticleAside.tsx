import Link from 'next/link';
import type { PostListItem } from '@features/posts/types/posts.types';
import { Eyebrow } from '@components/ui/Eyebrow';
import { DEFAULT_POST_CATEGORY_SLUG } from '@features/posts/types/posts.types';
import { ROUTES } from '@constants/routes';
import { formatDateKo } from '@utils/date';
import styles from './ArticleAside.module.css';

const normalize = (value: string) => value.normalize('NFKC').trim().toLocaleLowerCase('ko-KR');

export function ArticleAside({
  related,
  currentPost,
}: {
  related: PostListItem[];
  currentPost?: PostListItem;
}) {
  return (
    <aside className={styles.aside}>
      {related.length > 0 ? (
        <section className={styles.block}>
          <Eyebrow as="h2" className={styles.blockTitle}>
            관련 글
          </Eyebrow>
          <ul className={styles.related}>
            {related.map((item) => {
              const sharedTag = currentPost
                ? item.tags.find((tag) =>
                    currentPost.tags.some((value) => normalize(value) === normalize(tag)),
                  )
                : undefined;
              const sameCategory = Boolean(
                currentPost?.category?.slug && item.category?.slug === currentPost.category.slug,
              );
              const reason = sharedTag
                ? `같은 태그 #${sharedTag}`
                : sameCategory
                  ? '같은 주제의 글'
                  : null;
              return (
                <li key={item.slug}>
                  <Link
                    href={ROUTES.BLOG.DETAIL(
                      item.category?.slug ?? DEFAULT_POST_CATEGORY_SLUG,
                      item.slug,
                    )}
                    className={styles.relatedItem}
                    data-track-event="related_article_open"
                    data-track-source="related"
                  >
                    <span className={styles.relatedTitle}>{item.title}</span>
                    {reason ? <span className={styles.relatedReason}>{reason}</span> : null}
                    <span className={styles.relatedMeta}>
                      <time dateTime={item.published_at}>{formatDateKo(item.published_at)}</time>
                      {item.reading_time_min ? ` · ${item.reading_time_min}분` : ''}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </aside>
  );
}
