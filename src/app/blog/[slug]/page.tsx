import type { Metadata } from 'next';
import { Container } from '@components/layout/Container';
import { getPost, getPosts } from '@features/posts/services/posts.api';
import { renderMarkdown } from '@lib/markdown/render';
import { buildMetadata } from '@lib/metadata/metadata';
import { ROUTES } from '@constants/routes';
import { ArticleHeader } from '@/app/blog/[slug]/_components/ArticleHeader';
import { ArticleBody } from '@components/content/ArticleBody';
import { TableOfContents } from '@/app/blog/[slug]/_components/TableOfContents';
import { PostNav } from '@/app/blog/[slug]/_components/PostNav';
import styles from './article.module.css';

export const dynamicParams = true;

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const posts = await getPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const key = decodeURIComponent(slug).normalize('NFC');
  const post = await getPost(key);
  return buildMetadata({
    title: post.title,
    description: post.summary ?? undefined,
    path: ROUTES.BLOG.DETAIL(post.slug),
  });
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const key = decodeURIComponent(slug).normalize('NFC');
  const post = await getPost(key);
  const { html, toc } = await renderMarkdown(post.body_markdown);

  const all = await getPosts({ sort: '-published_at' });
  const index = all.findIndex((p) => p.slug === post.slug);
  const next = index > 0 ? all[index - 1] : null;
  const prev = index >= 0 && index < all.length - 1 ? all[index + 1] : null;

  return (
    <Container>
      <div className={styles.layout}>
        <article>
          <ArticleHeader post={post} />
          <ArticleBody html={html} />
          <PostNav prev={prev} next={next} />
        </article>
        <aside className={styles.aside}>
          <TableOfContents toc={toc} />
        </aside>
      </div>
    </Container>
  );
}
