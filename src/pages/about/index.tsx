import { motion } from "framer-motion";
import { ExternalLink, Mail, Phone } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

import { useThemeStore } from "@/features/theme/theme-store";
import { projectDetailPath, ROUTES } from "@/shared/config/routes";
import {
  aboutExtraParagraphs,
  avatarImageDark,
  avatarImageLight,
  certifications,
  contacts,
  education,
  externalActivities,
  introSections,
  introText,
  profileName,
  skills,
  workHistory,
} from "@/shared/content/profile";
import { projects } from "@/shared/content/projects";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

const featuredProject = projects[0];

const motionEnter = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: "easeOut" as const },
};

const linkClass = cn(
  "text-sm text-muted-foreground transition-colors",
  "hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
);

const externalLinkClass = cn(
  "inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors",
  "hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
);

export function AboutPage() {
  const effectiveTheme = useThemeStore(s => s.effectiveTheme);
  const avatarSrc =
    effectiveTheme === "dark" ? avatarImageDark : avatarImageLight;

  return (
    <>
      <Helmet>
        <title>About · {profileName}</title>
        <meta
          name="description"
          content={`${profileName} 소개, 스킬, 경력, 학력, 연락처.`}
        />
      </Helmet>
      <div className="container mx-auto max-w-4xl px-4 py-16 md:py-24">
        <motion.section {...motionEnter} className="mb-20 space-y-6 md:mb-24">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            About
          </h1>
          <p className="max-w-xl leading-relaxed text-muted-foreground">
            {profileName} 소개 및 경력·스킬 요약입니다.
          </p>
        </motion.section>

        <motion.section
          {...motionEnter}
          transition={{ ...motionEnter.transition, delay: 0.02 }}
          className="border-t border-border pt-16 md:pt-20"
          aria-labelledby="intro-heading"
        >
          <h2 id="intro-heading" className="sr-only">
            소개
          </h2>
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
              <p className="leading-relaxed text-muted-foreground">
                {introText}
              </p>
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
        </motion.section>

        <motion.section
          {...motionEnter}
          transition={{ ...motionEnter.transition, delay: 0.03 }}
          className="border-t border-border pt-16 md:pt-20"
          aria-labelledby="contacts-heading"
        >
          <h2
            id="contacts-heading"
            className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground"
          >
            Contacts
          </h2>
          <ul
            className="flex flex-wrap gap-x-6 gap-y-3 text-sm"
            aria-label="연락처"
          >
            <li>
              <a
                href={`tel:${contacts.tel.replace(/\s/g, "")}`}
                className={externalLinkClass}
              >
                <Phone className="size-3.5 shrink-0" aria-hidden />
                {contacts.tel}
              </a>
            </li>
            <li>
              <a
                href={`mailto:${contacts.email}`}
                className={externalLinkClass}
              >
                <Mail className="size-3.5 shrink-0" aria-hidden />
                {contacts.email}
              </a>
            </li>
            <li>
              <a
                href={contacts.github}
                target="_blank"
                rel="noopener noreferrer"
                className={externalLinkClass}
              >
                Github
                <ExternalLink className="size-3.5 shrink-0" aria-hidden />
              </a>
            </li>
          </ul>
        </motion.section>

        <motion.section
          {...motionEnter}
          transition={{ ...motionEnter.transition, delay: 0.04 }}
          className="border-t border-border pt-16 md:pt-20"
          aria-labelledby="skills-heading"
        >
          <h2
            id="skills-heading"
            className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground"
          >
            Skills
          </h2>
          <ul className="flex flex-wrap gap-2" aria-label="기술 스킬">
            {skills.map(name => (
              <li key={name}>
                <span className="rounded-[var(--radius)] border border-border bg-muted/50 px-3 py-1.5 text-sm text-foreground">
                  {name}
                </span>
              </li>
            ))}
          </ul>
        </motion.section>

        <motion.section
          {...motionEnter}
          transition={{ ...motionEnter.transition, delay: 0.05 }}
          className="border-t border-border pt-16 md:pt-20"
          aria-labelledby="work-heading"
        >
          <h2
            id="work-heading"
            className="mb-6 text-xs font-medium uppercase tracking-wider text-muted-foreground"
          >
            경력 사항
          </h2>
          <ul className="space-y-8" aria-label="경력">
            {workHistory.map((item, i) => (
              <li key={i} className="space-y-1">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="font-medium text-foreground">
                    {item.company}
                  </span>
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
        </motion.section>

        <motion.section
          {...motionEnter}
          transition={{ ...motionEnter.transition, delay: 0.055 }}
          className="border-t border-border pt-16 md:pt-20"
          aria-labelledby="external-heading"
        >
          <h2
            id="external-heading"
            className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground"
          >
            대외 활동
          </h2>
          <ul className="space-y-2" aria-label="대외 활동">
            {externalActivities.map((item, i) => (
              <li key={i} className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-foreground">{item.name}</span>
                <span className="text-sm text-muted-foreground">
                  {item.period}
                </span>
              </li>
            ))}
          </ul>
        </motion.section>

        <motion.section
          {...motionEnter}
          transition={{ ...motionEnter.transition, delay: 0.06 }}
          className="border-t border-border pt-16 md:pt-20"
          aria-labelledby="education-heading"
        >
          <h2
            id="education-heading"
            className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground"
          >
            학력
          </h2>
          <ul className="space-y-3" aria-label="학력">
            {education.map((item, i) => (
              <li key={i} className="space-y-0.5">
                <span className="font-medium text-foreground">
                  {item.school}
                </span>
                <p className="text-sm text-muted-foreground">
                  {item.description} · {item.period}
                </p>
              </li>
            ))}
          </ul>
        </motion.section>

        <motion.section
          {...motionEnter}
          transition={{ ...motionEnter.transition, delay: 0.065 }}
          className="border-t border-border pt-16 md:pt-20"
          aria-labelledby="certs-heading"
        >
          <h2
            id="certs-heading"
            className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground"
          >
            자격증
          </h2>
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
        </motion.section>

        {aboutExtraParagraphs.length > 0 && (
          <motion.section
            {...motionEnter}
            transition={{ ...motionEnter.transition, delay: 0.07 }}
            className="border-t border-border pt-16 md:pt-20"
            aria-labelledby="extra-heading"
          >
            <h2
              id="extra-heading"
              className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              그 외
            </h2>
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
          </motion.section>
        )}

        {featuredProject && (
          <motion.section
            {...motionEnter}
            transition={{ ...motionEnter.transition, delay: 0.08 }}
            className="border-t border-border pt-16 md:pt-20"
            aria-labelledby="featured-heading"
          >
            <h2
              id="featured-heading"
              className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              Featured
            </h2>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold tracking-tight md:text-2xl">
                {featuredProject.title}
              </h3>
              <p className="max-w-xl leading-relaxed text-muted-foreground">
                {featuredProject.summary}
              </p>
              <div>
                <Button asChild variant="outline" size="sm">
                  <Link to={projectDetailPath(featuredProject.id)}>
                    자세히 보기
                  </Link>
                </Button>
              </div>
            </div>
          </motion.section>
        )}

        <motion.section
          {...motionEnter}
          transition={{ ...motionEnter.transition, delay: 0.1 }}
          className="border-t border-border pt-16 md:pt-20"
          aria-labelledby="explore-heading"
        >
          <h2
            id="explore-heading"
            className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground"
          >
            Explore
          </h2>
          <p className="mb-6 max-w-xl leading-relaxed text-muted-foreground">
            프로젝트, 블로그, 연락처를 둘러볼 수 있습니다.
          </p>
          <div className="flex flex-col items-start gap-3">
            <Button
              asChild
              variant="link"
              className="h-auto p-0 text-foreground underline-offset-4 hover:underline"
            >
              <Link to={ROUTES.CONTACT}>Contact</Link>
            </Button>
            <ul
              className="flex flex-wrap gap-x-4 gap-y-1 text-sm"
              aria-label="사이트 내 페이지"
            >
              <li>
                <Link to={ROUTES.PROJECTS_LIST} className={linkClass}>
                  Projects
                </Link>
              </li>
              <li>
                <Link to={ROUTES.BLOG} className={linkClass}>
                  Blog
                </Link>
              </li>
            </ul>
          </div>
        </motion.section>
      </div>
    </>
  );
}
