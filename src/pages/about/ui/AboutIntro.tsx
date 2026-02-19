import {
  introSections,
  introText,
  profileName as defaultProfileName,
} from "@/shared/content/profile";

type AboutIntroProps = {
  avatarSrc: string;
  profileName?: string;
};

export function AboutIntro({
  avatarSrc,
  profileName = defaultProfileName,
}: AboutIntroProps) {
  return (
    <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:gap-10">
      <div className="shrink-0 overflow-hidden rounded-[var(--radius)] border border-border bg-muted/30">
        <img
          src={avatarSrc}
          alt={`${profileName} 프로필 사진`}
          width={160}
          height={160}
          className="size-36 object-cover sm:size-40"
          fetchPriority="high"
        />
      </div>
      <div className="min-w-0 flex-1 space-y-4">
        <p className="leading-relaxed text-muted-foreground">{introText}</p>
        {introSections.map((section, i) => (
          <div key={i} className="space-y-1">
            <h3 className="text-sm font-medium text-foreground">
              {section.title}
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {section.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
