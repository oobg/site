import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { Suspense } from 'react';
import { getBlogCategories, getBlogPost, getPosts } from '@features/posts/services/posts.api';
import { getRelatedPosts } from '@features/posts/utils/related';
import { getAdjacentPosts } from '@features/posts/utils/series';
import { renderMarkdown } from '@lib/markdown/render';
import { computeReadingTime } from '@lib/markdown/reading-time';
import { buildArticleMetadata } from '@lib/metadata/metadata';
import { buildBlogPostingStructuredData, serializeJsonLd } from '@lib/metadata/structured-data';
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
import { BlogArticleLinksSkeleton } from '@/app/_components/BlogLoadingSkeleton';
import { CommentsSection } from '@features/comments/components/CommentsSection';
import { getCommentAvatarBaseUrl } from '@features/comments/utils/comment-avatar';
import { DEFAULT_POST_CATEGORY_SLUG, type BlogPost } from '@features/posts/types/posts.types';
import styles from '@/app/blog/[slug]/article.module.css';

export const dynamicParams = true;
export const dynamic = 'force-dynamic';

export async function generateStaticParams(): Promise<{ category: string; slug: string }[]> {
  if (env.CONTENT_SOURCE === 'supabase') return [];
  const posts = await getPosts();
  return posts.map((post) => ({
    category: post.category?.slug ?? DEFAULT_POST_CATEGORY_SLUG,
    slug: post.slug,
  }));
}

async function getCanonicalPost(params: Promise<{ category: string; slug: string }>) {
  const { category, slug } = await params;
  const categoryKey = normalizeRouteSlug(category);
  const key = normalizeRouteSlug(slug);
  const post = await getBlogPost(key);
  if (post.category.slug !== categoryKey && post.category.legacy_slug !== categoryKey) notFound();
  return { post, categoryKey };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}): Promise<Metadata> {
  const { post } = await getCanonicalPost(params);
  return buildArticleMetadata({
    title: post.title,
    description: post.summary ?? undefined,
    path: ROUTES.BLOG.DETAIL(post.category.slug, post.slug),
    publishedTime: post.published_at,
    modifiedTime: post.updated_at,
  });
}

async function BlogPostLinks({ post }: { post: BlogPost }) {
  const all = await getPosts({ sort: '-published_at' });
  const { prev, next } = getAdjacentPosts(post, all);
  const related = getRelatedPosts(post, all, 3);

  return (
    <>
      <ArticleAside related={related} />
      <PostNav prev={prev} next={next} />
    </>
  );
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { post, categoryKey } = await getCanonicalPost(params);
  if (post.category.slug !== categoryKey) {
    permanentRedirect(ROUTES.BLOG.DETAIL(post.category.slug, post.slug));
  }
  const [categories, { html, toc }] = await Promise.all([
    getBlogCategories(),
    renderMarkdown(post.body_markdown),
  ]);
  const readingMin = post.reading_time_min ?? computeReadingTime(post.body_markdown);
  const avatarBaseUrl = getCommentAvatarBaseUrl(env);
  const path = ROUTES.BLOG.DETAIL(post.category.slug, post.slug);

  return (
    <BlogShell
      categories={categories}
      activeCategory={post.category.slug}
      detailNavigation={<TableOfContents toc={toc} />}
      mobileDetailNavigation={<TableOfContents toc={toc} defaultOpen={false} />}
    >
      <div className={styles.page}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(buildBlogPostingStructuredData(post, path)),
          }}
        />
        <article className={styles.main}>
          <ArticleHeader post={post} readingMin={readingMin} />
          <ArticleBody html={html} />
          <div className={styles.shareRail} aria-label="글 공유">
            <ShareButtons title={post.title} />
          </div>
        </article>
        <CommentsSection key={post.slug} slug={post.slug} avatarBaseUrl={avatarBaseUrl} />
        <Suspense fallback={<BlogArticleLinksSkeleton />}>
          <BlogPostLinks post={post} />
        </Suspense>
      </div>
    </BlogShell>
  );
}
