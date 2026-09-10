import { Container } from '@components/layout/Container';
import { AdminFrame } from '@features/admin/components/AdminFrame';
import styles from './admin.module.css';

export default function AdminLoading() {
  return (
    <Container>
      <div aria-label="관리자 목록을 불러오는 중" aria-busy="true">
        <AdminFrame title="글 관리" description="글 목록을 불러오고 있어요.">
          <div className={styles.skeleton} aria-hidden>
            <div className={styles.skeletonTitle} />
            {Array.from({ length: 7 }, (_, index) => (
              <div className={styles.skeletonRow} key={index} />
            ))}
          </div>
        </AdminFrame>
      </div>
    </Container>
  );
}
