import { education } from "@/shared/content/profile";

export function AboutEducation() {
  return (
    <ul className="space-y-3" aria-label="학력">
      {education.map((item, i) => (
        <li key={i} className="space-y-0.5">
          <span className="font-medium text-foreground">{item.school}</span>
          <p className="text-sm text-muted-foreground">
            {item.description} · {item.period}
          </p>
        </li>
      ))}
    </ul>
  );
}
