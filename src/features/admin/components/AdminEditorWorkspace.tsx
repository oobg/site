import Link from 'next/link';
import type { ReactNode } from 'react';
import { Plus } from '@phosphor-icons/react/dist/ssr';
import { ROUTES } from '@constants/routes';
import type { AdminPostSummary } from '@features/admin/services/posts.admin';
import { PostList } from './PostList';
import styles from './AdminEditorWorkspace.module.css';

export function AdminEditorWorkspace({
  posts,
  selectedId,
  children,
}: {
  posts: AdminPostSummary[];
  selectedId?: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.workspace}>
      <nav className={styles.navigation} aria-label="관리자 메뉴">
        <strong>raven</strong>
        <Link href={ROUTES.ADMIN.HOME}>글 관리</Link>
        <Link href={ROUTES.HOME}>사이트 보기</Link>
      </nav>
      <aside className={styles.listPane} aria-label="글 선택">
        <div className={styles.listHeader}>
          <div>
            <span>글 목록</span>
            <small>{posts.length}개</small>
          </div>
          <Link
            className={styles.newLink}
            href={ROUTES.ADMIN.NEW_POST}
            aria-current={!selectedId ? 'page' : undefined}
          >
            <Plus aria-hidden size={16} weight="bold" /> 새 글
          </Link>
        </div>
        <PostList
          compact
          selectedId={selectedId}
          posts={posts.map((post) => ({
            id: post.id,
            title: post.title,
            slug: post.slug,
            status: post.status,
            updatedAt: post.updated_at,
          }))}
        />
      </aside>
      <div className={styles.editorPane}>{children}</div>
    </div>
  );
}
