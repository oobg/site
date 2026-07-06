import type { Metadata } from 'next';
import { Container } from '@components/layout/Container';
import { PostRow } from '@features/posts/components/PostRow';
import { getPosts } from '@features/posts/services/posts.api';
import { buildMetadata } from '@lib/metadata/metadata';
import { ROUTES } from '@constants/routes';
import { TagFilter } from '@/app/blog/_components/TagFilter';
import styles from './blog.module.css';

export const metadata: Metadata = buildMetadata({
  title: '글',
  description: '생각을 다듬는 기록.',
  path: ROUTES.BLOG.LIST,
});

export default async function BlogListPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const { tag } = await searchParams;
  const all = await getPosts();
  const posts = tag ? await getPosts({ tag }) : all;
  const tags = [...new Set(all.flatMap((p) => p.tags))].sort();

  return (
    <Container>
      <header className={styles.header}>
        <h1 className={styles.title}>글</h1>
      </header>
      <TagFilter tags={tags} active={tag} />
      {posts.length === 0 ? (
        <p className={styles.empty}>아직 글이 없어요.</p>
      ) : (
        posts.map((post) => <PostRow key={post.slug} post={post} />)
      )}
    </Container>
  );
}
