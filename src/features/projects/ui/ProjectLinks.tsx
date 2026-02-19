import { Code2, ExternalLink, FileText, Play } from "lucide-react";
import { Link } from "react-router-dom";

import { isInternal } from "../lib/sortProjects";
import type { ProjectItem } from "../lib/schema";

const LINK_ENTRIES: Array<{
  key: keyof ProjectItem["links"];
  label: string;
  Icon: typeof FileText;
}> = [
  { key: "detail", label: "Detail", Icon: FileText },
  { key: "demo", label: "Demo", Icon: Play },
  { key: "repo", label: "Repo", Icon: Code2 },
  { key: "run", label: "Run", Icon: ExternalLink },
];

const linkClass =
  "inline-flex items-center gap-1.5 rounded text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function ProjectLinks({ project }: { project: ProjectItem }) {
  const { links } = project;
  const entries = LINK_ENTRIES.filter(({ key }) => links[key]);
  if (entries.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {entries.map(({ key, label, Icon }) => {
        const href = links[key]!;
        const internal = isInternal(href);
        return internal ? (
          <Link key={key} to={href} className={linkClass}>
            <Icon className="size-3.5" aria-hidden />
            {label}
          </Link>
        ) : (
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            <Icon className="size-3.5" aria-hidden />
            {label}
          </a>
        );
      })}
    </div>
  );
}
