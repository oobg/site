import { Link } from "react-router-dom";

import type { ProjectItem } from "@/features/projects";
import { projectDetailPath } from "@/shared/config/routes";
import { Button } from "@/shared/ui/Button";

type AboutFeaturedProps = { project: ProjectItem };

export function AboutFeatured({ project }: AboutFeaturedProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold tracking-tight md:text-2xl">
        {project.title}
      </h3>
      <p className="max-w-xl leading-relaxed text-muted-foreground">
        {project.summary}
      </p>
      <div>
        <Button asChild variant="outline" size="sm">
          <Link to={projectDetailPath(project.id)}>자세히 보기</Link>
        </Button>
      </div>
    </div>
  );
}
