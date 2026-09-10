'use client';

import { Container } from '@components/layout/Container';
import { useEffect } from 'react';
import { AdminFrame } from '@features/admin/components/AdminFrame';
import { GoogleLoginButton } from '@features/admin/components/GoogleLoginButton';
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
        description="연결 상태를 확인하고 다시 시도해 주세요."
      >
        <div className={styles.actions}>
          <button className={styles.retry} type="button" onClick={reset}>
            다시 시도
          </button>
          <section className={styles.login} aria-labelledby="admin-error-login-heading">
            <div>
              <h2 id="admin-error-login-heading">Google 계정으로 다시 연결</h2>
              <p>세션이 만료됐거나 계정을 다시 연결해야 한다면 이 페이지에서 로그인해 주세요.</p>
            </div>
            <GoogleLoginButton onSuccess={reset} />
          </section>
        </div>
      </AdminFrame>
    </Container>
  );
}
