import { createAdminApiPost, readAdminPostInput } from '@features/admin/services/posts-api';
import { adminError, adminJson } from '@lib/api/admin-http';
import { createAdminApiClient, requireAdminApiAccess } from '@lib/auth/admin-api';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const access = await requireAdminApiAccess(request);
    const input = await readAdminPostInput(request);
    const client = await createAdminApiClient(access);
    return adminJson(await createAdminApiPost(client, input), 201);
  } catch (error) {
    return adminError(error);
  }
}
