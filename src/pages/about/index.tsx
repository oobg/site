import { motion } from 'framer-motion'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'

import { ROUTES, projectDetailPath } from '@/shared/config/routes'
import {
  avatarImageDark,
  avatarImageLight,
  introText,
  skills,
  workHistory,
} from '@/shared/content/profile'
import { projects } from '@/shared/content/projects'
import { useThemeStore } from '@/features/theme/theme-store'
import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/lib/utils'

const featuredProject = projects[0]

const motionEnter = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: 'easeOut' as const },
}

const linkClass = cn(
  'text-sm text-muted-foreground transition-colors',
  'hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded'
)

export function AboutPage() {
  const effectiveTheme = useThemeStore((s) => s.effectiveTheme)
  const avatarSrc =
    effectiveTheme === 'dark' ? avatarImageDark : avatarImageLight

  return (
    <>
      <Helmet>
        <title>About · raven</title>
        <meta name="description" content="소개, 스킬, 경력, 대표 프로젝트." />
      </Helmet>
      <div className="container mx-auto max-w-4xl px-4 py-16 md:py-24">
        <motion.section
          {...motionEnter}
          className="mb-20 space-y-6 md:mb-24"
        >
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            About
          </h1>
          <p className="max-w-xl text-muted-foreground leading-relaxed">
            포트폴리오 소개 및 경력·스킬 요약입니다.
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
                alt="프로필 사진"
                width={160}
                height={160}
                className="size-36 object-cover sm:size-40"
                fetchPriority="high"
              />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <p className="text-muted-foreground leading-relaxed">
                {introText}
              </p>
            </div>
          </div>
        </motion.section>

        <motion.section
          {...motionEnter}
          transition={{ ...motionEnter.transition, delay: 0.03 }}
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
            {skills.map((name) => (
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
            회사 이력
          </h2>
          <ul className="space-y-8" aria-label="경력">
            {workHistory.map((item, i) => (
              <li key={i} className="space-y-1">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="font-medium text-foreground">
                    {item.company}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {item.period}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{item.role}</p>
                {item.description ? (
                  <p className="max-w-xl text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </motion.section>

        {featuredProject && (
          <motion.section
            {...motionEnter}
            transition={{ ...motionEnter.transition, delay: 0.07 }}
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
              <p className="max-w-xl text-muted-foreground leading-relaxed">
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
          <p className="mb-6 max-w-xl text-muted-foreground leading-relaxed">
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
  )
}
