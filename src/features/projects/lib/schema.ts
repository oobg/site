import { z } from "zod";

const projectLinksSchema = z
  .object({
    detail: z.string().optional(),
    demo: z.string().optional(),
    repo: z.string().optional(),
    run: z.string().optional(),
  })
  .refine(
    data =>
      data.detail !== undefined ||
      data.demo !== undefined ||
      data.repo !== undefined ||
      data.run !== undefined,
    { message: "links must have at least one of detail, demo, repo, run" }
  );

const periodSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

export const projectItemSchema = z.object({
  id: z.string(),
  type: z.enum(["project", "tool"]),
  title: z.string(),
  summary: z.string(),
  tags: z.array(z.string()),
  links: projectLinksSchema,
  status: z.string().optional(),
  period: periodSchema.optional(),
  thumbnail: z.string().optional(),
  featured: z.boolean().optional(),
});

export const projectsArraySchema = z.array(projectItemSchema);

export type ProjectItem = z.infer<typeof projectItemSchema>;
export type ProjectLinks = z.infer<typeof projectLinksSchema>;
export type ProjectPeriod = z.infer<typeof periodSchema>;
