import { motion } from "framer-motion";
import { type ChangeEvent, useMemo } from "react";
import { Helmet } from "react-helmet-async";

import {
  getProjects,
  ProjectCard,
  useProjectsFilter,
} from "@/features/projects";
import { motionEnter } from "@/shared/lib/motion";
import { Input } from "@/shared/ui/Input";
import { Select } from "@/shared/ui/Select";

export function ProjectsPage() {
  const all = useMemo(() => getProjects(), []);
  const {
    codeSectionItems,
    filteredAndSorted,
    search,
    setSearch,
    typeFilter,
    setTypeFilter,
    tagFilter,
    setTagFilter,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    allTags,
    allStatuses,
  } = useProjectsFilter(all);

  return (
    <>
      <Helmet>
        <title>Projects · raven</title>
        <meta name="description" content="프로젝트 및 툴 목록." />
      </Helmet>
      <div className="container mx-auto max-w-5xl px-4 py-16 md:py-24">
        <motion.section {...motionEnter} className="space-y-8">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Projects
          </h1>

          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
            <Input
              type="search"
              placeholder="제목, 요약, 태그 검색…"
              value={search}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setSearch(e.target.value)
              }
              className="max-w-xs"
              aria-label="검색"
            />
            <div className="flex flex-wrap items-center gap-2">
              <label
                htmlFor="filter-type"
                className="text-sm text-muted-foreground"
              >
                Type
              </label>
              <Select
                id="filter-type"
                value={typeFilter}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  setTypeFilter(e.target.value)
                }
                className="w-auto min-w-[7rem]"
              >
                <option value="all">전체</option>
                <option value="project">project</option>
                <option value="tool">tool</option>
              </Select>
              {allTags.length > 0 && (
                <>
                  <label
                    htmlFor="filter-tag"
                    className="text-sm text-muted-foreground"
                  >
                    Tag
                  </label>
                  <Select
                    id="filter-tag"
                    value={tagFilter}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                      setTagFilter(e.target.value)
                    }
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
                  <label
                    htmlFor="filter-status"
                    className="text-sm text-muted-foreground"
                  >
                    Status
                  </label>
                  <Select
                    id="filter-status"
                    value={statusFilter}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                      setStatusFilter(e.target.value)
                    }
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
                  setSortBy(e.target.value as "latest" | "name" | "featured")
                }
                className="w-auto min-w-[7rem]"
              >
                <option value="latest">최신</option>
                <option value="name">이름</option>
                <option value="featured">Featured</option>
              </Select>
            </div>
          </div>

          {filteredAndSorted.length === 0 ? (
            <p className="text-muted-foreground">
              조건에 맞는 항목이 없습니다.
            </p>
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
            <section
              className="border-t border-border pt-8"
              aria-labelledby="code-section-title"
            >
              <h2
                id="code-section-title"
                className="mb-4 text-xl font-semibold tracking-tight"
              >
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
