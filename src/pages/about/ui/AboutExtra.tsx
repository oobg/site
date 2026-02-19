import { aboutExtraParagraphs } from "@/shared/content/profile";

export function AboutExtra() {
  if (aboutExtraParagraphs.length === 0) return null;
  return (
    <div className="space-y-3">
      {aboutExtraParagraphs.map((p, i) => (
        <p
          key={i}
          className="max-w-xl text-sm leading-relaxed text-muted-foreground"
        >
          {p}
        </p>
      ))}
    </div>
  );
}
