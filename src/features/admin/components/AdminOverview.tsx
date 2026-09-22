import Link from 'next/link';
import { ArrowRight, ChartLine, FileText, Gear, Plus } from '@phosphor-icons/react/dist/ssr';
import { ROUTES } from '@constants/routes';
import type { BlogCategory } from '@features/posts/types/posts.types';
import type { AdminPostSummary } from '@features/admin/services/posts.admin';
import styles from './AdminOverview.module.css';

const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '날짜 없음' : dateFormatter.format(date);
}

function statusLabel(status: AdminPostSummary['status']) {
  return status === 'published' ? '공개' : '초안';
}

function categoryName(post: AdminPostSummary, categories: BlogCategory[]) {
  return categories.find((category) => category.id === post.category_id)?.name ?? '분류 없음';
}

export function AdminOverview({
  posts,
  categories,
}: {
  posts: AdminPostSummary[];
  categories: BlogCategory[];
}) {
  const publishedCount = posts.filter((post) => post.status === 'published').length;
  const draftCount = posts.length - publishedCount;
  const recentPosts = [...posts]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5);

  return (
    <div className={styles.overview}>
      <section className={styles.stats} aria-label="콘텐츠 요약">
        <div className={styles.stat}>
          <span>전체 글</span>
          <strong>{posts.length}</strong>
        </div>
        <div className={styles.stat}>
          <span>공개</span>
          <strong>{publishedCount}</strong>
        </div>
        <div className={styles.stat}>
          <span>초안</span>
          <strong>{draftCount}</strong>
        </div>
        <div className={styles.stat}>
          <span>분류</span>
          <strong>{categories.length}</strong>
        </div>
      </section>

      <section className={styles.quickSection} aria-labelledby="quick-actions-title">
        <div className={styles.sectionHeading}>
          <h2 id="quick-actions-title">빠른 작업</h2>
          <p>자주 쓰는 관리 화면으로 이동합니다.</p>
        </div>
        <div className={styles.quickLinks}>
          <Link className={styles.quickLink} href={ROUTES.ADMIN.NEW_POST}>
            <span className={styles.quickIcon}>
              <Plus aria-hidden size={19} weight="bold" />
            </span>
            <span>
              <strong>새 글 작성</strong>
              <small>새로운 초안을 시작합니다.</small>
            </span>
            <ArrowRight aria-hidden size={17} />
          </Link>
          <Link className={styles.quickLink} href={`${ROUTES.ADMIN.POSTS}&status=draft`}>
            <span className={styles.quickIcon}>
              <FileText aria-hidden size={19} />
            </span>
            <span>
              <strong>초안 보기</strong>
              <small>{draftCount}개의 초안을 확인합니다.</small>
            </span>
            <ArrowRight aria-hidden size={17} />
          </Link>
          <Link className={styles.quickLink} href={ROUTES.ADMIN.ANALYTICS}>
            <span className={styles.quickIcon}>
              <ChartLine aria-hidden size={19} />
            </span>
            <span>
              <strong>방문 통계</strong>
              <small>콘텐츠 성과를 살펴봅니다.</small>
            </span>
            <ArrowRight aria-hidden size={17} />
          </Link>
          <Link className={styles.quickLink} href={`${ROUTES.ADMIN.HOME}?view=settings`}>
            <span className={styles.quickIcon}>
              <Gear aria-hidden size={19} />
            </span>
            <span>
              <strong>블로그 설정</strong>
              <small>분류와 노출 순서를 관리합니다.</small>
            </span>
            <ArrowRight aria-hidden size={17} />
          </Link>
        </div>
      </section>

      <section className={styles.recentSection} aria-labelledby="recent-posts-title">
        <div className={styles.sectionHeading}>
          <h2 id="recent-posts-title">최근 글</h2>
          <Link className={styles.sectionLink} href={ROUTES.ADMIN.POSTS}>
            전체 글 보기 <ArrowRight aria-hidden size={15} />
          </Link>
        </div>
        {recentPosts.length > 0 ? (
          <div className={styles.recentList}>
            {recentPosts.map((post) => (
              <Link className={styles.postRow} href={ROUTES.ADMIN.POST(post.id)} key={post.id}>
                <span className={styles.postTitle}>{post.title || '제목 없는 글'}</span>
                <span className={styles.postCategory}>{categoryName(post, categories)}</span>
                <span className={styles.postStatus} data-status={post.status}>
                  {statusLabel(post.status)}
                </span>
                <time dateTime={post.updated_at}>{formatDate(post.updated_at)}</time>
                <ArrowRight className={styles.rowArrow} aria-hidden size={16} />
              </Link>
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <FileText aria-hidden size={24} />
            <strong>아직 작성한 글이 없습니다.</strong>
            <p>첫 글을 작성해 블로그를 시작해 보세요.</p>
            <Link href={ROUTES.ADMIN.NEW_POST}>
              새 글 작성 <ArrowRight aria-hidden size={15} />
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
