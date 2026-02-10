import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";

import { blogPosts } from "@/shared/content/blog";

export function BlogPage() {
  return (
    <>
      <Helmet>
        <title>Blog · raven</title>
        <meta name="description" content="블로그 목록." />
      </Helmet>
      <div className="container mx-auto max-w-4xl px-4 py-16 md:py-24">
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="space-y-10"
        >
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Blog
          </h1>
          <ul className="space-y-4">
            {blogPosts.map(post => (
              <li key={post.id} className="rounded-lg border border-border p-4">
                <h2 className="font-medium">{post.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {post.summary}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {post.date}
                </p>
              </li>
            ))}
          </ul>
        </motion.section>
      </div>
    </>
  );
}
