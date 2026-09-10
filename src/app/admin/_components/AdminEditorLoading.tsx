import { AdminFrame } from '@features/admin/components/AdminFrame';
import { PostEditorSkeleton } from '@features/admin/components/PostEditorSkeleton';
import styles from './AdminEditorLoading.module.css';

export function AdminEditorLoading() {
  return (
    <div className={styles.workspace} aria-label="관리자 편집기를 불러오는 중" aria-busy="true">
      <aside className={styles.list} aria-hidden>
        <span className={styles.listHeading} />
        {Array.from({ length: 9 }, (_, index) => (
          <span className={styles.listRow} key={index} />
        ))}
      </aside>
      <div className={styles.editor}>
        <AdminFrame compact title="글 불러오는 중" description="편집기를 준비하고 있어요.">
          <PostEditorSkeleton />
        </AdminFrame>
      </div>
    </div>
  );
}
