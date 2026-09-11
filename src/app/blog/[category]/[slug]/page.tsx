import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { getBlogCategories, getBlogPost, getPosts } from '@features/posts/services/posts.api';
import { getRelatedPosts } from '@features/posts/utils/related';
import { getAdjacentPosts } from '@features/posts/utils/series';
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
import { BlogArticleDataSkeleton } from '@/app/_components/BlogLoadingSkeleton';
import { CommentsSection } from '@features/comments/components/CommentsSection';
import { getCommentAvatarBaseUrl } from '@features/comments/utils/comment-avatar';
import {
  DEFAULT_POST_CATEGORY_SLUG,
  type BlogCategoryWithCount,
  type BlogPost,
} from '@features/posts/types/posts.types';
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
  if (post.category.slug !== categoryKey) notFound();
  return post;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}): Promise<Metadata> {
  const post = await getCanonicalPost(params);
  return buildMetadata({
    title: post.title,
    description: post.summary ?? undefined,
    path: ROUTES.BLOG.DETAIL(post.category.slug, post.slug),
  });
}

async function BlogPostContent({
  post,
  categories,
  html,
  toc,
  avatarBaseUrl,
}: {
  post: BlogPost;
  categories: BlogCategoryWithCount[];
  html: string;
  toc: Awaited<ReturnType<typeof renderMarkdown>>['toc'];
  avatarBaseUrl?: string;
}) {
  const readingMin = post.reading_time_min ?? computeReadingTime(post.body_markdown);

  const all = await getPosts({ sort: '-published_at' });
  const { prev, next } = getAdjacentPosts(post, all);
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
          <ArticleBody html={html} />
          <div className={styles.shareRail} aria-label="글 공유">
            <ShareButtons title={post.title} />
          </div>
        </article>
        <CommentsSection key={post.slug} slug={post.slug} avatarBaseUrl={avatarBaseUrl} />
        <ArticleAside related={related} />
        <PostNav prev={prev} next={next} />
      </div>
    </BlogShell>
  );
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const post = await getCanonicalPost(params);
  const categories = await getBlogCategories();
  const { html, toc } = await renderMarkdown(post.body_markdown);
  const readingMin = post.reading_time_min ?? computeReadingTime(post.body_markdown);
  const avatarBaseUrl = getCommentAvatarBaseUrl(env);

  return (
    <Suspense
      fallback={
        <BlogArticleDataSkeleton
          post={post}
          categories={categories}
          readingMin={readingMin}
          toc={toc}
        />
      }
    >
      <BlogPostContent
        post={post}
        categories={categories}
        html={html}
        toc={toc}
        avatarBaseUrl={avatarBaseUrl}
      />
    </Suspense>
  );
}
