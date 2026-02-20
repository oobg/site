import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

import { usePostsList } from "@/features/blog";
import { blogPostPath } from "@/shared/config/routes";
import { motionEnter } from "@/shared/lib/motion";
import { Button } from "@/shared/ui/Button";

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export function BlogPage() {
  const { data, isLoading, error } = usePostsList(0, 20);

  return (
    <>
      <Helmet>
        <title>Blog · raven</title>
        <meta name="description" content="블로그 목록." />
      </Helmet>
      <div className="container mx-auto max-w-4xl px-4 py-16 md:py-24">
        <motion.section
          {...motionEnter}
          className="space-y-10"
        >
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Blog
          </h1>

          {isLoading && (
            <p className="text-muted-foreground">불러오는 중…</p>
          )}

          {error ? (
            <div className="space-y-2">
              <p className="text-muted-foreground">
                목록을 불러오지 못했습니다.
              </p>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
              >
                다시 시도
              </Button>
            </div>
          ) : null}

          {!isLoading && !error && data ? (
            <ul className="space-y-4">
              {data.items.length === 0 ? (
                <li className="text-muted-foreground">글이 없습니다.</li>
              ) : (
                data.items.map(post => (
                  <li
                    key={post.id}
                    className="rounded-lg border border-border p-4"
                  >
                    <Link
                      to={blogPostPath(post.title)}
                      className="block font-medium text-foreground no-underline hover:text-primary"
                    >
                      {post.title}
                    </Link>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {post.content.slice(0, 200).replace(/\n/g, " ")}
                      {post.content.length > 200 ? "…" : ""}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {formatDate(post.meta.published_at)}
                      {post.meta.category && ` · ${post.meta.category.name}`}
                    </p>
                  </li>
                ))
              )}
            </ul>
          ) : null}
        </motion.section>
      </div>
    </>
  );
}
