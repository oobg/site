import { Skeleton } from '@components/ui/Skeleton';
import shell from './BlogShell.module.css';
import featured from './FeaturedCarousel.module.css';
import home from '@/app/_container/BlogHomeContainer.module.css';
import article from '@/app/blog/[slug]/article.module.css';
import card from '@features/posts/components/PostCard.module.css';
import styles from './BlogLoadingSkeleton.module.css';

const BODY_LINES = ['100%', '96%', '88%', '98%', '92%', '72%'];
const ARCHIVE_TITLES = ['82%', '68%', '76%', '88%', '64%', '72%'];

function PostCardSkeletons({ count = 3 }: { count?: number }) {
  return Array.from({ length: count }, (_, index) => (
    <article className={card.card} key={index}>
      <Skeleton className={card.cover} height="auto" radius="var(--d0-radius-control)" />
      <div className={card.body}>
        <Skeleton width="4rem" height="13px" />
        <Skeleton width={ARCHIVE_TITLES[index % ARCHIVE_TITLES.length]} height="18px" />
        <Skeleton width="92%" height="14px" />
        <Skeleton width="5rem" height="13px" />
      </div>
    </article>
  ));
}

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
          <PostCardSkeletons />
        </div>
        <div className={home.sections}>
          {[0, 1].map((section) => (
            <section className={home.topic} key={section}>
              <div className={home.topicHeading}>
                <Skeleton width="8rem" height="20px" />
                <Skeleton width="4rem" height="14px" />
              </div>
              <div className={home.topicGrid}>
                <PostCardSkeletons />
              </div>
            </section>
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
        <PostCardSkeletons count={12} />
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
          <ArticleHeaderSkeleton />
          <ArticleBodySkeleton />
          <ArticleFooterSkeleton />
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

function ArticleHeaderSkeleton() {
  return (
    <div className={styles.articleHeader} aria-hidden="true">
      <Skeleton className={styles.articleCover} height="auto" radius="var(--radius)" />
      <div className={styles.titleLines}>
        <Skeleton width="100%" height="44px" />
        <Skeleton width="72%" height="44px" />
      </div>
      <div className={styles.summaryLines}>
        <Skeleton width="100%" height="18px" />
        <Skeleton width="86%" height="18px" />
      </div>
      <div className={styles.byline}>
        <Skeleton width="34px" height="34px" radius="50%" />
        <div className={styles.bylineText}>
          <Skeleton width="5rem" height="14px" />
          <Skeleton width="9rem" height="13px" />
        </div>
      </div>
      <div className={styles.tagLines}>
        <Skeleton width="5rem" height="28px" />
        <Skeleton width="6rem" height="28px" />
      </div>
    </div>
  );
}

function ArticleFooterSkeleton({ showShare = true }: { showShare?: boolean }) {
  return (
    <div className={styles.articleFooter} aria-hidden="true">
      {showShare ? (
        <div className={styles.shareLines}>
          <Skeleton width="38px" height="38px" />
          <Skeleton width="38px" height="38px" />
        </div>
      ) : null}
      <Skeleton width="5rem" height="20px" />
      <div className={styles.commentForm}>
        <Skeleton width="100%" height="44px" />
        <Skeleton width="100%" height="120px" />
      </div>
    </div>
  );
}

export function BlogArticleLinksSkeleton() {
  return (
    <div className={styles.articleLinks} aria-busy="true" aria-label="관련 글을 불러오는 중">
      <Skeleton width="5rem" height="20px" />
      <div className={styles.linkRows} aria-hidden="true">
        <Skeleton width="82%" height="18px" />
        <Skeleton width="68%" height="18px" />
        <Skeleton width="76%" height="18px" />
      </div>
      <div className={styles.navRows} aria-hidden="true">
        <Skeleton width="42%" height="18px" />
        <Skeleton width="42%" height="18px" />
      </div>
    </div>
  );
}
