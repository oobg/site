import type { LoaderFunctionArgs } from "react-router-dom";

import { fetchPostByTitle } from "./api";

export async function blogPostLoader({
  params,
}: LoaderFunctionArgs): Promise<{ post: Awaited<ReturnType<typeof fetchPostByTitle>> }> {
  const encodedTitle = params.encodedTitle;
  if (!encodedTitle) throw new Response(null, { status: 404 });
  try {
    const title = decodeURIComponent(encodedTitle);
    const post = await fetchPostByTitle(title);
    return { post };
  } catch (e) {
    if (e instanceof Response) throw e;
    throw new Response(null, { status: 404 });
  }
}
