import { motion } from "framer-motion";
import { Code2, ExternalLink, FileText, Play } from "lucide-react";
import { type ChangeEvent, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

import type { ProjectItem } from "@/features/projects";
import { getProjects } from "@/features/projects";
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
import { Input } from "@/shared/ui/Input";
import { Select } from "@/shared/ui/Select";

const motionEnter = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: "easeOut" as const },
};

function isInternalDetail(item: ProjectItem): boolean {
  const href = item.links.detail;
  return !!href && href.startsWith("/");
}

type SortOption = "latest" | "name" | "featured";

function sortProjects(items: ProjectItem[], sortBy: SortOption): ProjectItem[] {
  const copy = [...items];
  if (sortBy === "latest") {
    copy.sort((a, b) => {
      const toA = a.period?.to ?? "";
      const toB = b.period?.to ?? "";
      if (toA && toB) return toB.localeCompare(toA);
      if (toA) return -1;
      if (toB) return 1;
      return 0;
    });
  } else if (sortBy === "name") {
    copy.sort((a, b) => a.title.localeCompare(b.title));
  } else {
    copy.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
  }
  return copy;
}

function ProjectCard({ item }: { item: ProjectItem }) {
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

export function ProjectsPage() {
  const all = useMemo(() => getProjects(), []);
  const mainList = useMemo(() => all.filter(p => p.section !== "code"), [all]);
  const codeSectionItems = useMemo(() => all.filter(p => p.section === "code"), [all]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("latest");

  const allTags = useMemo(
    () => Array.from(new Set(mainList.flatMap(p => p.tags))).sort(),
    [mainList]
  );
  const allStatuses = useMemo(
    () => Array.from(new Set(mainList.map(p => p.status).filter(Boolean))) as string[],
    [mainList]
  );

  const filteredAndSorted = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = mainList.filter(p => {
      if (typeFilter !== "all" && p.type !== typeFilter) return false;
      if (tagFilter !== "all" && !p.tags.includes(tagFilter)) return false;
      if (
        statusFilter !== "all" &&
        (p.status ?? "") !== statusFilter
      )
        return false;
      if (q) {
        const inTitle = p.title.toLowerCase().includes(q);
        const inSummary = p.summary.toLowerCase().includes(q);
        const inTags = p.tags.some(t => t.toLowerCase().includes(q));
        if (!inTitle && !inSummary && !inTags) return false;
      }
      return true;
    });
    return sortProjects(list, sortBy);
  }, [mainList, search, typeFilter, tagFilter, statusFilter, sortBy]);

  return (
    <>
      <Helmet>
        <title>Projects · raven</title>
        <meta name="description" content="프로젝트 및 툴 목록." />
      </Helmet>
      <div className="container mx-auto max-w-5xl px-4 py-16 md:py-24">
        <motion.section
          {...motionEnter}
          className="space-y-8"
        >
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Projects
          </h1>

          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
            <Input
              type="search"
              placeholder="제목, 요약, 태그 검색…"
              value={search}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setSearch(e.target.value)}
              className="max-w-xs"
              aria-label="검색"
            />
            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="filter-type" className="text-sm text-muted-foreground">
                Type
              </label>
              <Select
                id="filter-type"
                value={typeFilter}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                setTypeFilter(e.target.value)}
                className="w-auto min-w-[7rem]"
              >
                <option value="all">전체</option>
                <option value="project">project</option>
                <option value="tool">tool</option>
              </Select>
              {allTags.length > 0 && (
                <>
                  <label htmlFor="filter-tag" className="text-sm text-muted-foreground">
                    Tag
                  </label>
                  <Select
                    id="filter-tag"
                    value={tagFilter}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    setTagFilter(e.target.value)}
                    className="w-auto min-w-[7rem]"
                  >
                    <option value="all">전체</option>
                    {allTags.map(t => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </Select>
                </>
              )}
              {allStatuses.length > 0 && (
                <>
                  <label htmlFor="filter-status" className="text-sm text-muted-foreground">
                    Status
                  </label>
                  <Select
                    id="filter-status"
                    value={statusFilter}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    setStatusFilter(e.target.value)}
                    className="w-auto min-w-[7rem]"
                  >
                    <option value="all">전체</option>
                    {allStatuses.map(s => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                </>
              )}
              <label htmlFor="sort" className="text-sm text-muted-foreground">
                정렬
              </label>
              <Select
                id="sort"
                value={sortBy}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                setSortBy(e.target.value as SortOption)}
                className="w-auto min-w-[7rem]"
              >
                <option value="latest">최신</option>
                <option value="name">이름</option>
                <option value="featured">Featured</option>
              </Select>
            </div>
          </div>

          {filteredAndSorted.length === 0 ? (
            <p className="text-muted-foreground">조건에 맞는 항목이 없습니다.</p>
          ) : (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAndSorted.map(p => (
                <li key={p.id}>
                  <ProjectCard item={p} />
                </li>
              ))}
            </ul>
          )}

          {codeSectionItems.length > 0 && (
            <section className="border-t border-border pt-8" aria-labelledby="code-section-title">
              <h2 id="code-section-title" className="text-xl font-semibold tracking-tight mb-4">
                Code
              </h2>
              <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {codeSectionItems.map(p => (
                  <li key={p.id}>
                    <ProjectCard item={p} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </motion.section>
      </div>
    </>
  );
}
