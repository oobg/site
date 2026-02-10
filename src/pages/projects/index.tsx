import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

import { projectDetailPath } from "@/shared/config/routes";
import { projects } from "@/shared/content/projects";
import { cn } from "@/shared/lib/utils";

export function ProjectsPage() {
  return (
    <>
      <Helmet>
        <title>Projects · raven</title>
        <meta name="description" content="프로젝트 목록." />
      </Helmet>
      <div className="container mx-auto max-w-4xl px-4 py-16 md:py-24">
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="space-y-10"
        >
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Projects
          </h1>
          <ul className="space-y-6">
            {projects.map(p => (
              <li key={p.id}>
                <Link
                  to={projectDetailPath(p.id)}
                  className={cn(
                    "block rounded-lg border border-border p-4 transition-colors",
                    "hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  )}
                >
                  <h2 className="font-medium">{p.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {p.summary}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </motion.section>
      </div>
    </>
  );
}
