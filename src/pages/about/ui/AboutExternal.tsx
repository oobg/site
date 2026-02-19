import { externalActivities } from "@/shared/content/profile";

export function AboutExternal() {
  return (
    <ul className="space-y-2" aria-label="대외 활동">
      {externalActivities.map((item, i) => (
        <li key={i} className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-foreground">{item.name}</span>
          <span className="text-sm text-muted-foreground">{item.period}</span>
        </li>
      ))}
    </ul>
  );
}
