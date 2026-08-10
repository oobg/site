import type { PostListItem } from '@features/posts/types/posts.types';
import { ArrowLink } from '@components/ui/ArrowLink';
import { Eyebrow } from '@components/ui/Eyebrow';
import { ROUTES } from '@constants/routes';
import { formatDateKo } from '@utils/date';
import styles from './LatestThinking.module.css';

/* LatestWork 2열 중 왼쪽 열. 섹션 껍데기는 부모가 갖는다 —
   커버 유무와 무관하게 두 열이 항상 나란히 서야 오른쪽이 비지 않는다. */
export function LatestThinking({ post }: { post: PostListItem | null }) {
  if (!post) return null;
  const cover = post.cover_image_url;
  return (
    <article className={styles.column}>
      <Eyebrow>Latest thinking</Eyebrow>
      {cover ? (
        <img className={styles.image} src={cover} alt="" width={880} height={560} loading="lazy" />
      ) : null}
      <h2 className={styles.title}>{post.title}</h2>
      {post.summary ? <p className={styles.summary}>{post.summary}</p> : null}
      <div className={styles.meta}>
        {typeof post.reading_time_min === 'number' ? (
          <span>{post.reading_time_min}분 읽기</span>
        ) : null}
        <time dateTime={post.published_at}>{formatDateKo(post.published_at)}</time>
      </div>
      <ArrowLink href={ROUTES.BLOG.DETAIL(post.slug)}>Read article</ArrowLink>
    </article>
  );
}
