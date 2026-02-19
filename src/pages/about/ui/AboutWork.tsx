import { workHistory } from "@/shared/content/profile";

export function AboutWork() {
  return (
    <ul className="space-y-8" aria-label="경력">
      {workHistory.map((item, i) => (
        <li key={i} className="space-y-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="font-medium text-foreground">{item.company}</span>
            <span className="flex flex-wrap items-baseline gap-x-2 text-sm text-muted-foreground">
              <code className="rounded-e-sm rounded-s-sm border border-violet-500/40 bg-violet-500/25 px-1.5 py-0.5 font-mono text-xs font-medium text-foreground">
                {item.role}
              </code>
              <span>{item.period}</span>
            </span>
          </div>
          {item.description ? (
            <p className="w-full text-sm leading-relaxed text-muted-foreground">
              {item.description}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
