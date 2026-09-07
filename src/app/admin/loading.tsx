import { Container } from '@components/layout/Container';
import { AdminFrame } from '@features/admin/components/AdminFrame';
import styles from './admin.module.css';

export default function AdminLoading() {
  return (
    <Container>
      <AdminFrame title="글 관리" description="글 목록을 불러오고 있어요.">
        <div className={styles.skeleton} aria-label="글 목록을 불러오는 중" aria-busy="true">
          <div className={styles.skeletonRow} />
          <div className={styles.skeletonRow} />
          <div className={styles.skeletonRow} />
        </div>
      </AdminFrame>
    </Container>
  );
}
