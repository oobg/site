import Link from 'next/link';
import type { PostListItem } from '@features/posts/types/posts.types';
import { DEFAULT_POST_CATEGORY_SLUG } from '@features/posts/types/posts.types';
import { ROUTES } from '@constants/routes';
import styles from './PostRow.module.css';

function formatDate(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

export function PostRow({ post }: { post: PostListItem }) {
  return (
    // 링크는 제목 하나다. 별도 CTA를 두면 행에 링크가 둘이 되고, 그중 이름을 가진 쪽이
    // 'Read article'이라 목록에서 스크린리더가 같은 이름을 반복해 읽는다. 제목이 링크가
    // 되면 행 전체를 눌러도 열린다 — .title a::after가 행을 덮는다.
    <article className={styles.row}>
      <h2 className={styles.title}>
        <Link
          href={ROUTES.BLOG.DETAIL(post.category?.slug ?? DEFAULT_POST_CATEGORY_SLUG, post.slug)}
        >
          {post.title}
        </Link>
      </h2>
      {post.summary ? <p className={styles.summary}>{post.summary}</p> : null}
      <div className={styles.meta}>
        <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>
        <span className={styles.tags}>
          {post.tags.map((tag) => (
            <span key={tag}>#{tag}</span>
          ))}
        </span>
      </div>
    </article>
  );
}
