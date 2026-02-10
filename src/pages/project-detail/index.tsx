import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";

import { ROUTES } from "@/shared/config/routes";
import { getProjectById } from "@/shared/content/projects";
import { Button } from "@/shared/ui/button";
import { PreparingRouteLink } from "@/shared/ui/preparing-route-link";

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const project = id ? getProjectById(id) : undefined;

  if (!project) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-16">
        <p className="text-muted-foreground">프로젝트를 찾을 수 없습니다.</p>
        <Button asChild className="mt-4">
          <PreparingRouteLink to={ROUTES.PROJECTS_LIST}>
            목록으로
          </PreparingRouteLink>
        </Button>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{project.title} · raven</title>
        <meta name="description" content={project.summary} />
      </Helmet>
      <div className="container mx-auto max-w-4xl px-4 py-16 md:py-24">
        <motion.article
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="space-y-6"
        >
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            {project.title}
          </h1>
          <p className="text-muted-foreground">{project.summary}</p>
          {project.role && (
            <p className="text-sm">
              <span className="font-medium">역할:</span> {project.role}
            </p>
          )}
          {project.stack && project.stack.length > 0 && (
            <p className="text-sm">
              <span className="font-medium">스택:</span>{" "}
              {project.stack.join(", ")}
            </p>
          )}
          {project.links && project.links.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {project.links.map(l =>
                l.external ? (
                  <a
                    key={l.href}
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {l.label}
                  </a>
                ) : (
                  <Link
                    key={l.href}
                    to={l.href}
                    className="rounded text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {l.label}
                  </Link>
                )
              )}
            </div>
          )}
          <div className="pt-4">
            <Button asChild variant="outline">
              <PreparingRouteLink to={ROUTES.PROJECTS_LIST}>
                목록으로
              </PreparingRouteLink>
            </Button>
          </div>
        </motion.article>
      </div>
    </>
  );
}
