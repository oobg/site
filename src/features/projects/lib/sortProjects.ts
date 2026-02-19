import type { ProjectItem } from "./schema";

export function isInternalDetail(item: ProjectItem): boolean {
  const href = item.links.detail;
  return !!href && href.startsWith("/");
}

export function isInternal(href: string): boolean {
  return href.startsWith("/");
}

export type SortOption = "latest" | "name" | "featured";

export function sortProjects(
  items: ProjectItem[],
  sortBy: SortOption
): ProjectItem[] {
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
