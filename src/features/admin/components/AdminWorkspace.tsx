'use client';

import { Tabs } from '@base-ui/react/tabs';
import type { BlogCategory } from '@features/posts/types/posts.types';
import type { AdminPostSummary } from '@features/admin/services/posts.admin';
import { BlogSettings } from './BlogSettings';
import { PostList } from './PostList';
import styles from './AdminWorkspace.module.css';

export function AdminWorkspace({
  posts,
  categories,
}: {
  posts: AdminPostSummary[];
  categories: BlogCategory[];
}) {
  return (
    <Tabs.Root className={styles.workspace} defaultValue="posts">
      <Tabs.List className={styles.tabs} aria-label="관리 영역">
        <Tabs.Tab className={styles.tab} value="posts">
          글
        </Tabs.Tab>
        <Tabs.Tab className={styles.tab} value="settings">
          블로그 설정
        </Tabs.Tab>
        <Tabs.Indicator className={styles.indicator} />
      </Tabs.List>

      <Tabs.Panel className={styles.panel} value="posts">
        <PostList
          posts={posts.map((post) => ({
            id: post.id,
            title: post.title,
            slug: post.slug,
            status: post.status,
            updatedAt: post.updated_at,
          }))}
        />
      </Tabs.Panel>
      <Tabs.Panel className={styles.panel} value="settings">
        <BlogSettings categories={categories} posts={posts} />
      </Tabs.Panel>
    </Tabs.Root>
  );
}
