import { permanentRedirect } from 'next/navigation';
import { getBlogPost } from '@features/posts/services/posts.api';
import { encodeRouteSlug } from '@lib/navigation/route-segment';
import { normalizeRouteSlug } from '@lib/navigation/slug';
import { ROUTES } from '@constants/routes';

/**
 * 색인에 남아 있는 옛 두 세그먼트 주소(`/blog/{category}/{slug}`)를 현재 canonical
 * 한 세그먼트 주소로 308 이동시킨다.
 *
 * 부모 세그먼트가 이미 `[slug]`라 Next가 같은 자리에 다른 이름을 허용하지 않는다.
 * 그래서 `params.slug`가 옛 카테고리, `params.legacySlug`가 글 키다.
 */
export const dynamic = 'force-dynamic';

export default async function LegacyBlogPostPage({
  params,
}: {
  params: Promise<{ slug: string; legacySlug: string }>;
}) {
  const { slug: category, legacySlug } = await params;
  // 카테고리는 더 이상 canonical의 일부가 아니지만, 경로를 벗어나는 값은 여기서 404로 끊는다.
  normalizeRouteSlug(category);
  const key = normalizeRouteSlug(legacySlug);
  const post = await getBlogPost(key);
  permanentRedirect(ROUTES.BLOG.DETAIL(encodeRouteSlug(post.slug)));
}
