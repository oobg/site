import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getBlogCategories, getBlogPost, getPosts } from '@features/posts/services/posts.api';
import { getRelatedPosts } from '@features/posts/utils/related';
import { getAdjacentPosts } from '@features/posts/utils/series';
import { renderMarkdown } from '@lib/markdown/render';
import { computeReadingTime } from '@lib/markdown/reading-time';
import { buildArticleMetadata } from '@lib/metadata/metadata';
import { buildBlogPostingStructuredData, serializeJsonLd } from '@lib/metadata/structured-data';
import { encodeRouteSlug } from '@lib/navigation/route-segment';
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
import type { BlogCategoryWithCount, BlogPost } from '@features/posts/types/posts.types';
import styles from './article.module.css';

export const dynamicParams = true;
// supabase/api 소스는 요청 시점 데이터라 정적 프리렌더 대상이 아니다.
export const dynamic = 'force-dynamic';

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  if (env.CONTENT_SOURCE === 'supabase') return [];
  const posts = await getPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

/** canonical은 한 세그먼트다. 키를 인코딩해 절대 URL로 만들어도 한 세그먼트로 남게 한다. */
function canonicalPath(post: Pick<BlogPost, 'slug'>): string {
  return ROUTES.BLOG.DETAIL(encodeRouteSlug(post.slug));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const key = normalizeRouteSlug(slug);
  const post = await getBlogPost(key);
  return buildArticleMetadata({
    title: post.title,
    description: post.summary ?? undefined,
    path: canonicalPath(post),
    publishedTime: post.published_at,
    modifiedTime: post.updated_at,
  });
}

async function BlogPostContent({
  post,
  categories,
  html,
  toc,
}: {
  post: BlogPost;
  categories: BlogCategoryWithCount[];
  html: string;
  toc: Awaited<ReturnType<typeof renderMarkdown>>['toc'];
}) {
  const readingMin = post.reading_time_min ?? computeReadingTime(post.body_markdown);

  const all = await getPosts({ sort: '-published_at' });
  const { prev, next } = getAdjacentPosts(post, all);
  const related = getRelatedPosts(post, all, 3);

  return (
    <BlogShell
      categories={categories}
      activeCategory={post.category.slug}
      detail
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
        {/* 데스크톱 전용 오른쪽 레일. 900 이하에서는 CSS로 감추고 본문 위 접이식 목차만 남는다. */}
        <div className={styles.tocRail}>
          <TableOfContents toc={toc} />
        </div>
        <CommentsSection key={post.slug} slug={post.slug} />
        <ArticleAside related={related} />
        <PostNav prev={prev} next={next} />
      </div>
    </BlogShell>
  );
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const key = normalizeRouteSlug(slug);
  // 없는 글·안전하지 않은 키는 셸을 그리기 전에 404로 끊는다.
  const post = await getBlogPost(key);
  const [categories, { html, toc }] = await Promise.all([
    getBlogCategories(),
    renderMarkdown(post.body_markdown),
  ]);
  const readingMin = post.reading_time_min ?? computeReadingTime(post.body_markdown);

  return (
    <>
      {/* 관련 글 fetch가 늦어도 첫 flush에 실리도록 Suspense 밖에 둔다. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(buildBlogPostingStructuredData(post, canonicalPath(post))),
        }}
      />
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
        <BlogPostContent post={post} categories={categories} html={html} toc={toc} />
      </Suspense>
    </>
  );
}
