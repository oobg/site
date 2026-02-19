import { useMemo, useState } from "react";

import type { ProjectItem } from "./schema";
import type { SortOption } from "./sortProjects";
import { sortProjects } from "./sortProjects";

export function useProjectsFilter(all: ProjectItem[]) {
  const mainList = useMemo(() => all.filter(p => p.section !== "code"), [all]);
  const codeSectionItems = useMemo(
    () => all.filter(p => p.section === "code"),
    [all]
  );

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
    () =>
      Array.from(
        new Set(mainList.map(p => p.status).filter(Boolean))
      ) as string[],
    [mainList]
  );

  const filteredAndSorted = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = mainList.filter(p => {
      if (typeFilter !== "all" && p.type !== typeFilter) return false;
      if (tagFilter !== "all" && !p.tags.includes(tagFilter)) return false;
      if (statusFilter !== "all" && (p.status ?? "") !== statusFilter)
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

  return {
    mainList,
    codeSectionItems,
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
    filteredAndSorted,
  };
}
