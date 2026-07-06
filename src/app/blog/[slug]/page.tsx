import type { Metadata } from 'next';
import { getPost, getPosts } from '@features/posts/services/posts.api';
import { getRelatedPosts } from '@features/posts/utils/related';
import { renderMarkdown } from '@lib/markdown/render';
import { computeReadingTime } from '@lib/markdown/reading-time';
import { buildMetadata } from '@lib/metadata/metadata';
import { ROUTES } from '@constants/routes';
import { ArticleHeader } from '@/app/blog/[slug]/_components/ArticleHeader';
import { ArticleBody } from '@components/content/ArticleBody';
import { TableOfContents } from '@/app/blog/[slug]/_components/TableOfContents';
import { ArticleAside } from '@/app/blog/[slug]/_components/ArticleAside';
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
  const readingMin = post.reading_time_min ?? computeReadingTime(post.body_markdown);

  const all = await getPosts({ sort: '-published_at' });
  const index = all.findIndex((p) => p.slug === post.slug);
  const next = index > 0 ? all[index - 1] : null;
  const prev = index >= 0 && index < all.length - 1 ? all[index + 1] : null;
  const related = getRelatedPosts(post, all, 3);

  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        <div className={styles.tocCol}>
          <TableOfContents toc={toc} />
        </div>
        <article className={styles.main}>
          <ArticleHeader post={post} readingMin={readingMin} />
          <ArticleBody html={html} />
          <PostNav prev={prev} next={next} />
        </article>
        <div className={styles.asideCol}>
          <ArticleAside post={post} related={related} readingMin={readingMin} />
        </div>
      </div>
    </div>
  );
}
