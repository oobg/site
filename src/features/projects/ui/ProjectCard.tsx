import { Code2, ExternalLink, FileText, Play } from "lucide-react";
import { Link } from "react-router-dom";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/Card";

import type { ProjectItem } from "../lib/schema";
import { isInternalDetail } from "../lib/sortProjects";

export function ProjectCard({ item }: { item: ProjectItem }) {
  const detailPath = isInternalDetail(item) ? item.links.detail ?? null : null;
  const { links } = item;

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      {item.thumbnail && (
        <div className="aspect-video w-full overflow-hidden border-b border-border bg-muted/30">
          <img
            src={item.thumbnail}
            alt=""
            className="size-full object-cover"
          />
        </div>
      )}
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="line-clamp-1 text-lg">
            {detailPath ? (
              <Link
                to={detailPath}
                className="hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              >
                {item.title}
              </Link>
            ) : (
              item.title
            )}
          </CardTitle>
          <span
            className={cn(
              "shrink-0 rounded px-2 py-0.5 text-xs font-medium",
              item.type === "tool"
                ? "bg-violet-500/15 text-violet-600 dark:text-violet-400"
                : "bg-muted text-muted-foreground"
            )}
          >
            {item.type}
          </span>
        </div>
        <CardDescription className="line-clamp-2">{item.summary}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pt-0">
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {item.tags.map(tag => (
              <span
                key={tag}
                className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2 border-t border-border pt-4">
        {detailPath && (
          <Button asChild variant="outline" size="sm">
            <Link to={detailPath} className="inline-flex items-center gap-1.5">
              <FileText className="size-3.5" aria-hidden />
              Detail
            </Link>
          </Button>
        )}
        {links.demo && (
          <Button asChild variant="outline" size="sm">
            <a
              href={links.demo}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5"
            >
              <Play className="size-3.5" aria-hidden />
              Demo
            </a>
          </Button>
        )}
        {links.repo && (
          <Button asChild variant="outline" size="sm">
            <a
              href={links.repo}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5"
            >
              <Code2 className="size-3.5" aria-hidden />
              Repo
            </a>
          </Button>
        )}
        {links.run && (
          <Button asChild variant="outline" size="sm">
            {links.run.startsWith("/") ? (
              <Link to={links.run} className="inline-flex items-center gap-1.5">
                <ExternalLink className="size-3.5" aria-hidden />
                Run
              </Link>
            ) : (
              <a
                href={links.run}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5"
              >
                <ExternalLink className="size-3.5" aria-hidden />
                Run
              </a>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
