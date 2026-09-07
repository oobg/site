'use client';

import { Container } from '@components/layout/Container';
import { AdminFrame } from '@features/admin/components/AdminFrame';
import styles from './error.module.css';

export default function AdminError({ reset }: { error: Error; reset: () => void }) {
  return (
    <Container>
      <AdminFrame
        title="글을 불러오지 못했어요"
        description="연결 상태를 확인하고 다시 시도해 주세요."
      >
        <button className={styles.retry} type="button" onClick={reset}>
          다시 시도
        </button>
      </AdminFrame>
    </Container>
  );
}
