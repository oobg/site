import projectsJson from "./data/projects.json";
import { projectsArraySchema } from "./schema";

const projects = projectsArraySchema.parse(projectsJson);

export function getProjects(): typeof projects {
  return projects;
}

export function getProjectById(id: string): (typeof projects)[number] | undefined {
  return projects.find(p => p.id === id);
}
