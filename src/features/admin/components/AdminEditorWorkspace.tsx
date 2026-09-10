import Link from 'next/link';
import type { ReactNode } from 'react';
import { Plus } from '@phosphor-icons/react/dist/ssr';
import { ROUTES } from '@constants/routes';
import type { AdminPostSummary } from '@features/admin/services/posts.admin';
import type { BlogCategory } from '@features/posts/types/posts.types';
import { PostList } from './PostList';
import styles from './AdminEditorWorkspace.module.css';

export function AdminEditorWorkspace({
  posts,
  selectedId,
  categories = [],
  children,
}: {
  posts: AdminPostSummary[];
  selectedId?: string;
  categories?: BlogCategory[];
  children: ReactNode;
}) {
  return (
    <div className={styles.workspace}>
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
            createdAt: post.created_at ?? post.updated_at,
            updatedAt: post.updated_at,
            categoryId: post.category_id,
            categoryName: categories.find((category) => category.id === post.category_id)?.name,
          }))}
          categories={categories}
        />
      </aside>
      <div className={styles.editorPane}>{children}</div>
    </div>
  );
}
