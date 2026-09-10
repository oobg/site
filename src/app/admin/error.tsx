'use client';

import { Container } from '@components/layout/Container';
import { useEffect } from 'react';
import { AdminFrame } from '@features/admin/components/AdminFrame';
import styles from './error.module.css';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Admin rendering failed', { digest: error.digest });
  }, [error]);

  return (
    <Container>
      <AdminFrame
        title="글을 불러오지 못했어요"
        description="글 관리 화면을 불러오는 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요."
      >
        <button className={styles.retry} type="button" onClick={reset}>
          다시 시도
        </button>
      </AdminFrame>
    </Container>
  );
}
