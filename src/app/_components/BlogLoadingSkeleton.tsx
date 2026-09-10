import { Skeleton } from '@components/ui/Skeleton';
import { BlogShell } from '@/app/_components/BlogShell';
import { ArticleHeader } from '@/app/blog/[slug]/_components/ArticleHeader';
import { TableOfContents } from '@/app/blog/[slug]/_components/TableOfContents';
import { ShareButtons } from '@/app/blog/[slug]/_components/ShareButtons';
import type { BlogCategoryWithCount, BlogPost } from '@features/posts/types/posts.types';
import type { TocEntry } from '@lib/markdown/toc.types';
import shell from './BlogShell.module.css';
import featured from './FeaturedCarousel.module.css';
import home from '@/app/_container/BlogHomeContainer.module.css';
import article from '@/app/blog/[slug]/article.module.css';
import card from '@features/posts/components/PostCard.module.css';
import styles from './BlogLoadingSkeleton.module.css';

const BODY_LINES = ['100%', '96%', '88%', '98%', '92%', '72%'];
const CARD_TITLES = ['76%', '62%', '84%'];
const ARCHIVE_TITLES = ['82%', '68%', '76%', '88%', '64%', '72%'];

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className={shell.shell} aria-busy="true" aria-label="불러오는 중">
      <aside className={shell.sidebar} aria-hidden="true">
        <Skeleton width="7rem" height="24px" />
        <div className={shell.navigation}>
          <Skeleton width="72%" height="42px" />
          <Skeleton width="84%" height="42px" />
          <Skeleton width="65%" height="42px" />
        </div>
      </aside>
      <div className={shell.mobileBar} aria-hidden="true">
        <Skeleton width="7rem" height="20px" />
        <Skeleton width="5rem" height="40px" />
      </div>
      <div className={shell.content}>{children}</div>
    </div>
  );
}

export function BlogHomeSkeleton() {
  return (
    <Shell>
      <div className={home.overview}>
        <div className={home.overviewHeading}>
          <Skeleton width="6rem" height="24px" />
          <Skeleton width="5rem" height="20px" />
        </div>
        <section className={featured.section} data-with-cover="">
          <div className={featured.slide}>
            <Skeleton className={featured.cover} height="auto" radius="var(--d0-radius-card)" />
            <div className={`${featured.copy} ${styles.featuredCopy}`} data-with-cover="">
              <Skeleton width="4rem" height="13px" />
              <Skeleton width="84%" height="30px" />
              <Skeleton width="100%" height="16px" />
              <Skeleton width="5rem" height="13px" />
            </div>
          </div>
          <div className={featured.controls}>
            <Skeleton width="40px" height="40px" radius="var(--d0-radius-sm)" />
            <Skeleton width="2rem" height="13px" />
            <Skeleton width="40px" height="40px" radius="var(--d0-radius-sm)" />
          </div>
        </section>
        <div className={home.recentGrid}>
          {CARD_TITLES.map((width, index) => (
            <article className={card.card} key={index}>
              <Skeleton className={card.cover} height="auto" radius="var(--d0-radius-control)" />
              <div className={card.body}>
                <Skeleton width="4rem" height="13px" />
                <Skeleton width={width} height="18px" />
                <Skeleton width="92%" height="14px" />
                <Skeleton width="5rem" height="13px" />
              </div>
            </article>
          ))}
        </div>
      </div>
    </Shell>
  );
}

export function BlogArchiveContentSkeleton({ showHeading = true }: { showHeading?: boolean }) {
  return (
    <div aria-label="글 목록을 불러오는 중" aria-busy="true">
      {showHeading ? (
        <div className={home.heading}>
          <div className={styles.archiveHeading}>
            <Skeleton width="6rem" height="28px" />
            <Skeleton width="13rem" height="15px" />
          </div>
        </div>
      ) : null}
      <div className={home.grid}>
        {ARCHIVE_TITLES.map((width, index) => (
          <article className={card.card} key={index}>
            <Skeleton className={card.cover} height="auto" radius="var(--d0-radius-control)" />
            <div className={card.body}>
              <Skeleton width="4rem" height="13px" />
              <Skeleton width={width} height="18px" />
              <Skeleton width="92%" height="14px" />
              <Skeleton width="5rem" height="13px" />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export function BlogArchiveSkeleton() {
  return (
    <Shell>
      <section className={home.archive}>
        <BlogArchiveContentSkeleton />
      </section>
    </Shell>
  );
}

export function BlogArticleSkeleton() {
  return (
    <Shell>
      <div className={article.page}>
        <article className={article.main}>
          <ArticleBodySkeleton />
        </article>
      </div>
    </Shell>
  );
}

function ArticleBodySkeleton({ compact = false }: { compact?: boolean }) {
  const lines = compact ? BODY_LINES.slice(0, 3) : BODY_LINES;
  return (
    <div className={styles.body} aria-hidden="true">
      {lines.map((width, index) => (
        <Skeleton key={index} width={width} height="var(--fs-15)" />
      ))}
    </div>
  );
}

export function BlogArticleDataSkeleton({
  post,
  categories,
  readingMin,
  toc,
}: {
  post: BlogPost;
  categories: BlogCategoryWithCount[];
  readingMin: number;
  toc: TocEntry[];
}) {
  return (
    <BlogShell
      categories={categories}
      activeCategory={post.category.slug}
      detailNavigation={<TableOfContents toc={toc} />}
      mobileDetailNavigation={<TableOfContents toc={toc} defaultOpen={false} />}
    >
      <div className={article.page} aria-busy="true" aria-label="글 본문을 불러오는 중">
        <article className={article.main}>
          <ArticleHeader post={post} readingMin={readingMin} />
          <div className={article.shareRail} aria-label="글 공유">
            <ShareButtons title={post.title} />
          </div>
          <ArticleBodySkeleton compact />
        </article>
      </div>
    </BlogShell>
  );
}
