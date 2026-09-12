import {
  findAdminApiPost,
  parseAdminPostSlug,
  putAdminApiPost,
  readAdminPostInput,
} from '@features/admin/services/posts-api';
import { AdminApiError, adminError, adminJson } from '@lib/api/admin-http';
import { createAdminApiClient, requireAdminApiAccess } from '@lib/auth/admin-api';

export const runtime = 'nodejs';
type Context = { params: Promise<{ slug: string }> };

export async function GET(request: Request, { params }: Context) {
  try {
    const access = await requireAdminApiAccess(request);
    const slug = parseAdminPostSlug((await params).slug);
    const post = await findAdminApiPost(await createAdminApiClient(access), slug);
    if (!post) throw new AdminApiError(404, 'POST_NOT_FOUND', '글을 찾을 수 없습니다.');
    return adminJson({ post });
  } catch (error) {
    return adminError(error);
  }
}

export async function PUT(request: Request, { params }: Context) {
  try {
    const access = await requireAdminApiAccess(request);
    const slug = parseAdminPostSlug((await params).slug);
    const input = await readAdminPostInput(request, slug);
    const result = await putAdminApiPost(await createAdminApiClient(access), input);
    return adminJson(result, result.created ? 201 : 200);
  } catch (error) {
    return adminError(error);
  }
}
