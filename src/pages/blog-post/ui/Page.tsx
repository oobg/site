import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import ReactMarkdown from "react-markdown";
import { Link, useLoaderData } from "react-router-dom";

import { ROUTES } from "@/shared/config/routes";
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

export function BlogPostPage() {
  const { post } = useLoaderData() as { post: Awaited<ReturnType<typeof import("@/features/blog").fetchPostByTitle>> };

  const description =
    post.content.slice(0, 160).replace(/\n/g, " ").trim() + (post.content.length > 160 ? "…" : "");

  return (
    <>
      <Helmet>
        <title>{post.title} · raven</title>
        <meta name="description" content={description} />
      </Helmet>
      <div className="container mx-auto max-w-4xl px-4 py-16 md:py-24">
        <motion.article {...motionEnter} className="space-y-6">
          <header className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <time dateTime={post.meta.published_at}>
                {formatDate(post.meta.published_at)}
              </time>
              {post.meta.category && (
                <span className="rounded px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
                  {post.meta.category.name}
                </span>
              )}
            </div>
          </header>

          <div
            className="blog-post-content space-y-4 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-4 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm [&_ul]:list-inside [&_ul]:list-disc [&_ol]:list-inside [&_ol]:list-decimal [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mt-4 [&_h3]:text-lg [&_h3]:font-semibold"
          >
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>

          <div className="pt-4">
            <Button asChild variant="outline">
              <Link to={ROUTES.BLOG}>목록으로</Link>
            </Button>
          </div>
        </motion.article>
      </div>
    </>
  );
}
