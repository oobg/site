import { motion } from "framer-motion";
import { Code2, ExternalLink, FileText, Play } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";

import { getProjectById } from "@/features/projects";
import { ROUTES } from "@/shared/config/routes";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/Button";

function isInternal(href: string): boolean {
  return href.startsWith("/");
}

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const project = id ? getProjectById(id) : undefined;

  if (!project) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-16">
        <p className="text-muted-foreground">프로젝트를 찾을 수 없습니다.</p>
        <Button asChild className="mt-4" variant="outline">
          <Link to={ROUTES.PROJECTS_LIST}>목록으로</Link>
        </Button>
      </div>
    );
  }

  const { links } = project;
  const linkEntries = [
    links.detail && ["Detail", links.detail, FileText],
    links.demo && ["Demo", links.demo, Play],
    links.repo && ["Repo", links.repo, Code2],
    links.run && ["Run", links.run, ExternalLink],
  ].filter(Boolean) as [string, string, typeof FileText][];

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
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              {project.title}
            </h1>
            <span
              className={cn(
                "rounded px-2 py-0.5 text-xs font-medium",
                project.type === "tool"
                  ? "bg-violet-500/15 text-violet-600 dark:text-violet-400"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {project.type}
            </span>
          </div>
          <p className="text-muted-foreground">{project.summary}</p>
          {project.status && (
            <p className="text-sm">
              <span className="font-medium">Status:</span> {project.status}
            </p>
          )}
          {project.period && (project.period.from || project.period.to) && (
            <p className="text-sm">
              <span className="font-medium">기간:</span>{" "}
              {[project.period.from, project.period.to].filter(Boolean).join(" ~ ")}
            </p>
          )}
          {project.tags.length > 0 && (
            <p className="text-sm">
              <span className="font-medium">태그:</span>{" "}
              {project.tags.join(", ")}
            </p>
          )}
          {project.thumbnail && (
            <div className="overflow-hidden rounded-[var(--radius)] border border-border">
              <img
                src={project.thumbnail}
                alt=""
                className="w-full max-w-lg object-cover"
              />
            </div>
          )}
          {linkEntries.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {linkEntries.map(([label, href, Icon]) => {
                const internal = isInternal(href);
                const className =
                  "inline-flex items-center gap-1.5 rounded text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
                return internal ? (
                  <Link
                    key={href}
                    to={href}
                    className={className}
                  >
                    <Icon className="size-3.5" aria-hidden />
                    {label}
                  </Link>
                ) : (
                  <a
                    key={href}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={className}
                  >
                    <Icon className="size-3.5" aria-hidden />
                    {label}
                  </a>
                );
              })}
            </div>
          )}
          <div className="pt-4">
            <Button asChild variant="outline">
              <Link to={ROUTES.PROJECTS_LIST}>목록으로</Link>
            </Button>
          </div>
        </motion.article>
      </div>
    </>
  );
}
