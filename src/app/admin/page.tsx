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
import { env } from '@configs/env';
import { getCommentAvatarBaseUrl } from '@features/comments/utils/comment-avatar';
import styles from './admin.module.css';

export const metadata = { title: '글 관리' };

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; view?: string }>;
}) {
  const [access, query] = await Promise.all([getOwnerAccess(), searchParams]);
  const authError = getAuthMessage(query.error);
  const view =
    query.view === 'settings' ? 'settings' : query.view === 'comments' ? 'comments' : 'posts';

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
  const avatarBaseUrl = getCommentAvatarBaseUrl(env);
  return (
    <div className={styles.page}>
      <AdminFrame
        title={view === 'settings' ? '블로그 설정' : view === 'comments' ? '댓글 관리' : '글 관리'}
        description={
          view === 'settings'
            ? '분류와 대표 글 노출 순서를 관리합니다.'
            : view === 'comments'
              ? '방문자가 남긴 댓글을 관리합니다.'
              : `${posts.length}개의 글이 있어요.`
        }
        actions={
          <Link className={styles.newLink} href={ROUTES.ADMIN.NEW_POST}>
            <Plus aria-hidden size={18} weight="bold" />새 글
          </Link>
        }
      >
        <AdminWorkspace
          posts={posts}
          categories={categories}
          view={view}
          avatarBaseUrl={avatarBaseUrl}
        />
      </AdminFrame>
    </div>
  );
}
