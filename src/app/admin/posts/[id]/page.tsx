import { notFound } from 'next/navigation';
import { Container } from '@components/layout/Container';
import { AccessPanel } from '@features/admin/components/AccessPanel';
import { AdminBackLink } from '@features/admin/components/AdminBackLink';
import { AdminFrame } from '@features/admin/components/AdminFrame';
import { LoginPanel } from '@features/admin/components/LoginPanel';
import { PostEditor } from '@features/admin/components/PostEditor';
import { DeletePostButton } from '@features/admin/components/DeletePostButton';
import { updatePostAction } from '@features/admin/services/posts.actions';
import { getAdminPost, listAdminCategories } from '@features/admin/services/posts.admin';
import { getOwnerAccess } from '@lib/auth/owner';

export const metadata = { title: '글 수정' };

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const access = await getOwnerAccess();
  if (!access.configured || !access.authenticated) {
    return (
      <Container>
        <AdminFrame title="글 수정" description="수정하려면 먼저 관리자 계정으로 로그인해 주세요.">
          <LoginPanel configured={access.configured} />
        </AdminFrame>
      </Container>
    );
  }
  if (!access.authorized) {
    return (
      <Container>
        <AdminFrame
          title="글 수정"
          description="등록된 작성자만 글을 수정할 수 있어요."
          userEmail={access.email ?? undefined}
        >
          <AccessPanel email={access.email} />
        </AdminFrame>
      </Container>
    );
  }

  const { id } = await params;
  const [post, categories] = await Promise.all([getAdminPost(id), listAdminCategories()]);
  if (!post) notFound();

  return (
    <Container>
      <AdminFrame
        title="글 수정"
        description={`마지막 수정 ${new Intl.DateTimeFormat('ko-KR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(post.updated_at))}`}
        userEmail={access.email ?? undefined}
        actions={<AdminBackLink />}
      >
        <PostEditor
          action={updatePostAction}
          post={{
            id: post.id,
            title: post.title,
            slug: post.slug,
            description: post.description,
            body: post.body,
            status: post.status,
            category_id: post.category_id,
            tags: post.tags,
            cover_image_key: post.cover_image_key,
            cover_image_url: post.cover_image_url,
            cover_position_x: post.cover_position_x,
            cover_position_y: post.cover_position_y,
            cover_alt: post.cover_alt,
          }}
          categories={categories}
        />
        <DeletePostButton id={post.id} />
      </AdminFrame>
    </Container>
  );
}
