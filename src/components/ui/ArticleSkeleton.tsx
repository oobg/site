import { Container } from '@components/layout/Container';
import { Skeleton } from '@components/ui/Skeleton';
import styles from './ArticleSkeleton.module.css';

// 본문 라인 폭(자연스러운 리듬).
const LINES = ['100%', '96%', '98%', '90%', '100%', '88%', '94%', '100%', '92%', '70%'];

/**
 * 아티클/일반 콘텐츠용 로딩 스켈레톤. 읽기 폭으로 가운데 정렬.
 * 상세 페이지(blog/[slug], projects/[slug])와 루트 fallback에서 공유한다.
 *
 * Container를 대신 쓰는 것이 아니라 반드시 함께 쓴다. 이 스켈레톤이 대신하는 화면들이
 * 전부 Container 안에 있어서, 여기만 빠지면 로딩이 끝나는 순간 좌우로 --outer만큼 튄다.
 * 뷰포트가 읽기 폭보다 넓은 데스크톱에서는 어긋나지 않아 눈에 띄지 않는다.
 */
export function ArticleSkeleton() {
  return (
    <Container>
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
    </Container>
  );
}
