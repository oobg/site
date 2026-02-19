import { certifications } from "@/shared/content/profile";

export function AboutCertifications() {
  return (
    <ul
      className="flex flex-wrap gap-x-4 gap-y-1 text-sm"
      aria-label="자격증"
    >
      {certifications.map((item, i) => (
        <li key={i}>
          <span className="text-foreground">{item.name}</span>
          <span className="text-muted-foreground"> ({item.date})</span>
        </li>
      ))}
    </ul>
  );
}
