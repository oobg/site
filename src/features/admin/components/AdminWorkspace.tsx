'use client';

import type { BlogCategory } from '@features/posts/types/posts.types';
import type { AdminPostSummary } from '@features/admin/services/posts.admin';
import { AdminOverview } from './AdminOverview';
import { BlogSettings } from './BlogSettings';
import { PostList } from './PostList';
import { AdminComments } from '@features/comments/components/AdminComments';
import styles from './AdminWorkspace.module.css';

export function AdminWorkspace({
  posts,
  categories,
  view = 'overview',
}: {
  posts: AdminPostSummary[];
  categories: BlogCategory[];
  view?: 'overview' | 'posts' | 'settings' | 'comments';
}) {
  if (view === 'overview' || !view) return <AdminOverview posts={posts} categories={categories} />;
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
          createdAt: post.created_at ?? post.updated_at,
          updatedAt: post.updated_at,
          categoryId: post.category_id,
          categoryName: categories.find((category) => category.id === post.category_id)?.name,
          coverImageUrl: post.cover_image_url,
          coverPositionX: post.cover_position_x,
          coverPositionY: post.cover_position_y,
        }))}
        categories={categories}
      />
    </div>
  );
}
