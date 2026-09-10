import Link from 'next/link';
import { Plus } from '@phosphor-icons/react/dist/ssr';
import { Container } from '@components/layout/Container';
import { ROUTES } from '@constants/routes';
import { AccessPanel } from '@features/admin/components/AccessPanel';
import { AdminFrame } from '@features/admin/components/AdminFrame';
import { LoginPanel } from '@features/admin/components/LoginPanel';
import { AdminWorkspace } from '@features/admin/components/AdminWorkspace';
import { listAdminCategories, listAdminPosts } from '@features/admin/services/posts.admin';
import { getOwnerAccess } from '@lib/auth/owner';
import { getAuthMessage } from './authMessages';
import styles from './admin.module.css';

export const metadata = { title: '글 관리' };

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [access, query] = await Promise.all([getOwnerAccess(), searchParams]);
  const authError = getAuthMessage(query.error);

  if (!access.configured || !access.authenticated) {
    return (
      <Container>
        <AdminFrame title="글 관리" description="초안부터 공개까지 한곳에서 관리합니다.">
          {authError ? (
            <p className={styles.authError} role="alert">
              {authError}
            </p>
          ) : null}
          <LoginPanel configured={access.configured} />
        </AdminFrame>
      </Container>
    );
  }

  if (!access.authorized) {
    return (
      <Container>
        <AdminFrame
          title="글 관리"
          description="이 공간은 등록된 작성자만 사용할 수 있어요."
          userEmail={access.email ?? undefined}
        >
          <AccessPanel email={access.email} />
        </AdminFrame>
      </Container>
    );
  }

  const [posts, categories] = await Promise.all([listAdminPosts(), listAdminCategories()]);
  return (
    <Container>
      <AdminFrame
        title="글 관리"
        description={`${posts.length}개의 글이 있어요. 최근 수정한 순서로 표시합니다.`}
        userEmail={access.email ?? undefined}
        actions={
          <Link className={styles.newLink} href={ROUTES.ADMIN.NEW_POST}>
            <Plus aria-hidden size={18} weight="bold" />새 글
          </Link>
        }
      >
        <AdminWorkspace posts={posts} categories={categories} />
      </AdminFrame>
    </Container>
  );
}
