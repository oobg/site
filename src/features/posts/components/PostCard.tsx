import Link from 'next/link';
import type { BlogPostSummary } from '@features/posts/types/posts.types';
import { ROUTES } from '@constants/routes';
import styles from './PostCard.module.css';

/* .cover의 aspect-ratio 1.9와 같은 비율. 표시 크기는 CSS가 정하고, 이 값은
   로드 전에 자리를 잡기 위한 비율 힌트다. */
const COVER_WIDTH = 760;
const COVER_HEIGHT = 400;

/* 카드가 어느 섹션 아래 놓이느냐에 따라 제목의 층이 달라진다. 항상 h2로 두면
   "최근 글" 같은 섹션 레이블과 같은 층이 되어, 목차만 읽는 사람에게는 카드가
   섹션의 형제로 보인다. 모양은 두 단계 모두 같다(:is(h2, h3)). */
export function PostCard({
  post,
  reserveCoverSpace = false,
  showCategory = true,
  headingLevel = 2,
  variant = 'default',
}: {
  post: BlogPostSummary;
  reserveCoverSpace?: boolean;
  showCategory?: boolean;
  headingLevel?: 2 | 3;
  variant?: 'default' | 'compact';
}) {
  const Heading = headingLevel === 3 ? 'h3' : 'h2';
  const hasCover = Boolean(post.cover_image_url || reserveCoverSpace);
  return (
    <article
      className={variant === 'compact' ? `${styles.card} ${styles.compact}` : styles.card}
      data-no-cover={!post.cover_image_url || undefined}
      data-reserved={reserveCoverSpace || undefined}
      data-has-cover={hasCover || undefined}
    >
      {post.cover_image_url ? (
        <Link
          className={styles.cover}
          href={ROUTES.BLOG.DETAIL(post.category.slug, post.slug)}
          tabIndex={-1}
          aria-hidden="true"
        >
          <img
            src={post.cover_image_url}
            alt=""
            width={COVER_WIDTH}
            height={COVER_HEIGHT}
            loading="lazy"
            decoding="async"
            style={{
              objectPosition: `${post.cover_position.x * 100}% ${post.cover_position.y * 100}%`,
            }}
          />
        </Link>
      ) : reserveCoverSpace ? (
        <div className={styles.coverPlaceholder} data-cover-placeholder="" aria-hidden="true" />
      ) : null}
      <div className={styles.body}>
        {showCategory ? <span className={styles.category}>{post.category.name}</span> : null}
        <Heading>
          <Link href={ROUTES.BLOG.DETAIL(post.category.slug, post.slug)}>{post.title}</Link>
        </Heading>
        {post.summary && <p>{post.summary}</p>}
        <time dateTime={post.published_at}>
          {new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' }).format(
            new Date(post.published_at),
          )}
        </time>
      </div>
    </article>
  );
}
