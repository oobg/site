import { skills } from "@/shared/content/profile";

export function AboutSkills() {
  return (
    <ul className="flex flex-wrap gap-2" aria-label="기술 스킬">
      {skills.map(name => (
        <li key={name}>
          <span className="rounded-[var(--radius)] border border-border bg-muted/50 px-3 py-1.5 text-sm text-foreground">
            {name}
          </span>
        </li>
      ))}
    </ul>
  );
}
