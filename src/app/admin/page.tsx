import Link from 'next/link';
import { Plus } from '@phosphor-icons/react/dist/ssr';
import { Container } from '@components/layout/Container';
import { ROUTES } from '@constants/routes';
import { AccessPanel } from '@features/admin/components/AccessPanel';
import { AdminFrame } from '@features/admin/components/AdminFrame';
import { LoginPanel } from '@features/admin/components/LoginPanel';
import { PostList } from '@features/admin/components/PostList';
import { listAdminPosts } from '@features/admin/services/posts.admin';
import { getOwnerAccess } from '@lib/auth/owner';
import styles from './admin.module.css';

export const metadata = { title: '글 관리' };

const authMessages: Record<string, string> = {
  oauth: 'Google 로그인을 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.',
  'invalid-origin': '로그인 콜백 주소를 확인할 수 없습니다. SITE_URL 설정을 확인해 주세요.',
  'not-configured': '관리자 로그인 환경 변수가 아직 설정되지 않았습니다.',
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [access, query] = await Promise.all([getOwnerAccess(), searchParams]);
  const authError = query.error ? authMessages[query.error] : undefined;

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

  const posts = await listAdminPosts();
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
        <PostList
          posts={posts.map((post) => ({
            id: post.id,
            title: post.title,
            slug: post.slug,
            status: post.status,
            updatedAt: post.updated_at,
          }))}
        />
      </AdminFrame>
    </Container>
  );
}
