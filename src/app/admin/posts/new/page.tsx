import { Container } from '@components/layout/Container';
import { AccessPanel } from '@features/admin/components/AccessPanel';
import { AdminFrame } from '@features/admin/components/AdminFrame';
import { AdminEditorWorkspace } from '@features/admin/components/AdminEditorWorkspace';
import { LoginPanel } from '@features/admin/components/LoginPanel';
import { PostEditor } from '@features/admin/components/PostEditor';
import { createPostAction } from '@features/admin/services/posts.actions';
import { listAdminCategories, listAdminPosts } from '@features/admin/services/posts.admin';
import { getOwnerAccess } from '@lib/auth/owner';

export const metadata = { title: '새 글 작성' };

export default async function NewPostPage() {
  const access = await getOwnerAccess();
  if (!access.configured || !access.authenticated) {
    return (
      <Container>
        <AdminFrame
          compact
          title="새 글 작성"
          description="작성하려면 먼저 관리자 계정으로 로그인해 주세요."
        >
          <LoginPanel configured={access.configured} />
        </AdminFrame>
      </Container>
    );
  }
  if (!access.authorized) {
    return (
      <Container>
        <AdminFrame
          title="새 글 작성"
          description="등록된 작성자만 글을 만들 수 있어요."
          userEmail={access.email ?? undefined}
        >
          <AccessPanel email={access.email} />
        </AdminFrame>
      </Container>
    );
  }

  const [categories, posts] = await Promise.all([listAdminCategories(), listAdminPosts()]);
  return (
    <AdminEditorWorkspace posts={posts} categories={categories}>
      <div>
        <AdminFrame
          compact
          title="새 글 작성"
          description="내용을 다듬는 동안 초안으로 저장하고, 준비되면 공개할 수 있어요."
          userEmail={access.email ?? undefined}
        >
          <PostEditor action={createPostAction} categories={categories} />
        </AdminFrame>
      </div>
    </AdminEditorWorkspace>
  );
}
