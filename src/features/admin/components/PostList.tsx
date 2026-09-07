import Link from 'next/link';
import { ArrowRight, FilePlus } from '@phosphor-icons/react/dist/ssr';
import { ROUTES } from '@constants/routes';
import styles from './PostList.module.css';

export type AdminPostListItem = {
  id: string;
  slug: string;
  title: string;
  status: 'draft' | 'published';
  updatedAt: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' }).format(new Date(value));
}

export function PostList({ posts }: { posts: AdminPostListItem[] }) {
  if (posts.length === 0) {
    return (
      <div className={styles.empty}>
        <FilePlus aria-hidden size={28} weight="regular" />
        <h2>아직 작성한 글이 없어요</h2>
        <p>첫 초안을 만들면 이곳에서 상태와 수정일을 확인할 수 있어요.</p>
        <Link className={styles.primary} href={ROUTES.ADMIN.NEW_POST}>
          새 글 작성
        </Link>
      </div>
    );
  }

  return (
    <ul className={styles.list} aria-label="글 목록">
      {posts.map((post) => (
        <li className={styles.row} key={post.id}>
          <div className={styles.content}>
            <Link className={styles.title} href={ROUTES.ADMIN.POST(post.id)}>
              {post.title}
            </Link>
            <span className={styles.slug}>/{post.slug}</span>
          </div>
          <div className={styles.meta}>
            <span className={post.status === 'published' ? styles.published : styles.draft}>
              {post.status === 'published' ? '공개' : '초안'}
            </span>
            <time dateTime={post.updatedAt}>{formatDate(post.updatedAt)}</time>
            <ArrowRight aria-hidden size={18} />
          </div>
        </li>
      ))}
    </ul>
  );
}
