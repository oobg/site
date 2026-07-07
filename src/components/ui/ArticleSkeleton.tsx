import { Skeleton } from '@components/ui/Skeleton';
import styles from './ArticleSkeleton.module.css';

// 본문 라인 폭(자연스러운 리듬).
const LINES = ['100%', '96%', '98%', '90%', '100%', '88%', '94%', '100%', '92%', '70%'];

/**
 * 아티클/일반 콘텐츠용 로딩 스켈레톤. 읽기 폭으로 가운데 정렬.
 * 상세 페이지(blog/[slug], projects/[slug])와 루트 fallback에서 공유한다.
 */
export function ArticleSkeleton() {
  return (
    <div className={styles.wrap} aria-busy aria-label="불러오는 중">
      <Skeleton width="78%" height="var(--fs-40)" />
      <div className={styles.meta}>
        <Skeleton width="10rem" height="var(--fs-15)" />
      </div>
      <div className={styles.body}>
        {LINES.map((w, i) => (
          <Skeleton key={i} width={w} height="var(--fs-15)" />
        ))}
      </div>
    </div>
  );
}
