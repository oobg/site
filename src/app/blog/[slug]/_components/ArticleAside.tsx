import Link from 'next/link';
import type { PostListItem } from '@features/posts/types/posts.types';
import { Eyebrow } from '@components/ui/Eyebrow';
import { ROUTES } from '@constants/routes';
import { formatDateKo } from '@utils/date';
import styles from './ArticleAside.module.css';

export function ArticleAside({ related }: { related: PostListItem[] }) {
  return (
    <aside className={styles.aside}>
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
