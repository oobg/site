import { permanentRedirect } from 'next/navigation';
import { getBlogPost } from '@features/posts/services/posts.api';
import { normalizeRouteSlug } from '@lib/navigation/slug';
import { ROUTES } from '@constants/routes';

export const dynamic = 'force-dynamic';

// The first segment is named category to share Next.js's canonical route tree;
// on this one-segment legacy route it contains the old post slug.
export default async function LegacyBlogPostPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: slug } = await params;
  const post = await getBlogPost(normalizeRouteSlug(slug));
  permanentRedirect(ROUTES.BLOG.DETAIL(post.category.slug, post.slug));
}
