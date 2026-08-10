import type { PostListItem } from '@features/posts/types/posts.types';
import { ArrowLink } from '@components/ui/ArrowLink';
import { Eyebrow } from '@components/ui/Eyebrow';
import { ROUTES } from '@constants/routes';
import styles from './RecentPosts.module.css';

/* 최신 한 편을 크게 세우는 대신 최근 목록을 조밀한 행으로 깐다.
   글이 하나뿐일 때도 성립하고, 늘어날수록 화면이 자연히 채워진다.
   피처드 한 편을 따로 두면 그 글이 목록에도 나와 같은 항목이 두 번 보인다. */
export function RecentPosts({ posts }: { posts: PostListItem[] }) {
  if (posts.length === 0) return null;
  return (
    <section className={styles.section}>
      <Eyebrow>최근에 쓴 글</Eyebrow>
      <ul className={styles.list}>
        {posts.map((post) => (
          <li key={post.slug} className={styles.item}>
            <time className={styles.date} dateTime={post.published_at}>
              {post.published_at.slice(0, 10)}
            </time>
            <a className={styles.title} href={ROUTES.BLOG.DETAIL(post.slug)}>
              {post.title}
            </a>
            {post.tags.length > 0 ? (
              <span className={styles.tags}>{post.tags.map((t) => `#${t}`).join(' ')}</span>
            ) : null}
          </li>
        ))}
      </ul>
      <div className={styles.more}>
        <ArrowLink href={ROUTES.BLOG.LIST}>글 전체 보기</ArrowLink>
      </div>
    </section>
  );
}
