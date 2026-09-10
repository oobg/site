import type { Metadata } from 'next';
import { getBlogCategories, getBlogPost, getPosts } from '@features/posts/services/posts.api';
import { getRelatedPosts } from '@features/posts/utils/related';
import { renderMarkdown } from '@lib/markdown/render';
import { computeReadingTime } from '@lib/markdown/reading-time';
import { buildMetadata } from '@lib/metadata/metadata';
import { normalizeRouteSlug } from '@lib/navigation/slug';
import { env } from '@configs/env';
import { ROUTES } from '@constants/routes';
import { ArticleHeader } from '@/app/blog/[slug]/_components/ArticleHeader';
import { ArticleBody } from '@components/content/ArticleBody';
import { TableOfContents } from '@/app/blog/[slug]/_components/TableOfContents';
import { ArticleAside } from '@/app/blog/[slug]/_components/ArticleAside';
import { PostNav } from '@/app/blog/[slug]/_components/PostNav';
import { ShareButtons } from '@/app/blog/[slug]/_components/ShareButtons';
import { BlogShell } from '@/app/_components/BlogShell';
import styles from './article.module.css';

export const dynamicParams = true;
export const dynamic = 'force-dynamic';

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  if (env.CONTENT_SOURCE === 'supabase') return [];
  const posts = await getPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const key = normalizeRouteSlug(slug);
  const post = await getBlogPost(key);
  return buildMetadata({
    title: post.title,
    description: post.summary ?? undefined,
    path: ROUTES.BLOG.DETAIL(post.slug),
  });
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const key = normalizeRouteSlug(slug);
  const post = await getBlogPost(key);
  const { html, toc } = await renderMarkdown(post.body_markdown);
  const readingMin = post.reading_time_min ?? computeReadingTime(post.body_markdown);

  const [all, categories] = await Promise.all([
    getPosts({ sort: '-published_at' }),
    getBlogCategories(),
  ]);
  const index = all.findIndex((p) => p.slug === post.slug);
  const next = index > 0 ? all[index - 1] : null;
  const prev = index >= 0 && index < all.length - 1 ? all[index + 1] : null;
  const related = getRelatedPosts(post, all, 3);

  return (
    <BlogShell
      categories={categories}
      activeCategory={post.category.slug}
      detailNavigation={<TableOfContents toc={toc} />}
      mobileDetailNavigation={<TableOfContents toc={toc} defaultOpen={false} />}
    >
      <div className={styles.page}>
        <article className={styles.main}>
          <ArticleHeader post={post} readingMin={readingMin} />
          <div className={styles.shareRail} aria-label="글 공유">
            <ShareButtons title={post.title} />
          </div>
          <ArticleBody html={html} />
        </article>
        <ArticleAside post={post} related={related} readingMin={readingMin} />
        <PostNav prev={prev} next={next} />
      </div>
    </BlogShell>
  );
}
