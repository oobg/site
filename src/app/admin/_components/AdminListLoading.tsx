import { AdminFrame } from '@features/admin/components/AdminFrame';
import styles from './AdminListLoading.module.css';

export function AdminListLoading() {
  return (
    <div className={styles.page} aria-label="관리자 목록을 불러오는 중" aria-busy="true">
      <AdminFrame title="글 관리" description="글 목록을 불러오고 있어요.">
        <div className={styles.filters} aria-hidden>
          <span />
          <span />
          <span />
        </div>
        <div className={styles.tableHeader} aria-hidden>
          <span>제목</span>
          <span>상태</span>
          <span>카테고리</span>
          <span>생성일</span>
          <span>최종 수정일</span>
          <span />
        </div>
        <div className={styles.rows} aria-hidden>
          {Array.from({ length: 8 }, (_, index) => (
            <div className={styles.row} key={index}>
              <div className={styles.titleCell}>
                <span />
                <span />
              </div>
              <span className={styles.status} />
              <span className={styles.category} />
              <span className={styles.createdDate} />
              <span className={styles.date} />
              <span className={styles.action} />
            </div>
          ))}
        </div>
      </AdminFrame>
    </div>
  );
}
