'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Container } from '@components/layout/Container';
import { ROUTES } from '@constants/routes';
import type { OwnerAccess } from '@lib/auth/owner';
import { getAuthMessage } from '@/app/admin/authMessages';
import { AdminFrame } from '@features/admin/components/AdminFrame';
import { LoginPanel } from '@features/admin/components/LoginPanel';
import { AccessPanel } from '@features/admin/components/AccessPanel';

/** Only access information is passed here; protected page children never enter this branch. */
export function AdminAccessScreen({ access }: { access: OwnerAccess }) {
  const error = getAuthMessage(useSearchParams().get('error') ?? undefined);
  return (
    <Container>
      <AdminFrame title="글 관리" description="등록된 작성자 계정으로 로그인해 주세요.">
        {error ? <p role="alert">{error}</p> : null}
        {access.authenticated && !access.authorized ? (
          <AccessPanel email={access.email} />
        ) : (
          <LoginPanel configured={access.configured} />
        )}
        <Link href={ROUTES.HOME}>공개 글 목록으로 돌아가기</Link>
      </AdminFrame>
    </Container>
  );
}
