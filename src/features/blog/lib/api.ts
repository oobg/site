import type { PostsListData } from "./schema";
import {
  parsePostItemResponse,
  parsePostsListResponse,
} from "./schema";

const getBaseUrl = (): string => {
  const base = import.meta.env.VITE_API_BASE;
  return typeof base === "string" ? base : "";
};

export async function fetchPostsList(
  skip: number,
  limit: number,
  cursor?: string
): Promise<PostsListData> {
  const base = getBaseUrl();
  const params = new URLSearchParams({ skip: String(skip), limit: String(limit) });
  if (cursor) params.set("cursor", cursor);
  const url = `${base}/api/v1/posts/list?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Response(null, { status: res.status });
  const json = (await res.json()) as unknown;
  return parsePostsListResponse(json);
}

export async function fetchPostByTitle(title: string): Promise<ReturnType<typeof parsePostItemResponse>> {
  const base = getBaseUrl();
  const params = new URLSearchParams({ t: title });
  const url = `${base}/api/v1/posts/item?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Response(null, { status: res.status });
  const json = (await res.json()) as unknown;
  return parsePostItemResponse(json);
}
