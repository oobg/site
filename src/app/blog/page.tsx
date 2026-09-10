import { redirect } from 'next/navigation';
import { homeSearchHref } from '@constants/routes';

export default async function BlogListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  redirect(homeSearchHref(await searchParams));
}
