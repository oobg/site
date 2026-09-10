'use client';

import type { BlogCategory } from '@features/posts/types/posts.types';
import type { AdminPostSummary } from '@features/admin/services/posts.admin';
import { BlogSettings } from './BlogSettings';
import { PostList } from './PostList';
import { AdminComments } from '@features/comments/components/AdminComments';
import styles from './AdminWorkspace.module.css';

export function AdminWorkspace({
  posts,
  categories,
  view = 'posts',
}: {
  posts: AdminPostSummary[];
  categories: BlogCategory[];
  view?: 'posts' | 'settings' | 'comments';
}) {
  if (view === 'settings') return <BlogSettings categories={categories} posts={posts} />;
  if (view === 'comments') return <AdminComments />;
  return (
    <div className={styles.workspace}>
      <PostList
        posts={posts.map((post) => ({
          id: post.id,
          title: post.title,
          slug: post.slug,
          status: post.status,
          updatedAt: post.updated_at,
          categoryName: categories.find((category) => category.id === post.category_id)?.name,
        }))}
      />
    </div>
  );
}
