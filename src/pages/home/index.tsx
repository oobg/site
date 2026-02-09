import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronRight, FolderGit2, Mail, User } from 'lucide-react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'

import { ROUTES } from '@/shared/config/routes'
import {
  heroRoleLabel,
  skills,
  welcomeCodeLines,
  welcomeDescription,
  welcomeSections,
  welcomeTitle,
} from '@/shared/content/profile'
import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/lib/utils'

const TYPING_INTERVAL_MS = 48

type TokenType = 'keyword' | 'string' | 'comment' | 'identifier' | 'plain'

interface Token {
  type: TokenType
  start: number
  end: number
}

function tokenizeCode(text: string): Token[] {
  const tokens: Token[] = []
  const keywords = new Set(['const', 'export', 'default'])
  let i = 0
  while (i < text.length) {
    const rest = text.slice(i)
    const keyword = rest.match(/^\b(const|export|default)\b/)
    const string = rest.match(/^"(?:[^"\\]|\\.)*"/)
    const comment = rest.match(/^\/\/[^\n]*/)
    const identifier = rest.match(/^[a-zA-Z_][a-zA-Z0-9_]*/)
    if (keyword) {
      tokens.push({ type: 'keyword', start: i, end: i + keyword[0].length })
      i += keyword[0].length
    } else if (string) {
      tokens.push({ type: 'string', start: i, end: i + string[0].length })
      i += string[0].length
    } else if (comment) {
      tokens.push({ type: 'comment', start: i, end: i + comment[0].length })
      i += comment[0].length
    } else if (identifier && !keywords.has(identifier[0])) {
      tokens.push({ type: 'identifier', start: i, end: i + identifier[0].length })
      i += identifier[0].length
    } else {
      tokens.push({ type: 'plain', start: i, end: i + 1 })
      i += 1
    }
  }
  return tokens
}

const VSCODE_CLASS: Record<TokenType, string> = {
  keyword: 'text-[#569cd6]',
  string: 'text-[#ce9178]',
  comment: 'text-[#6a9955]',
  identifier: 'text-[#9cdcfe]',
  plain: 'text-[#d4d4d4]',
}

function TypingCodeBlock({ lines }: { lines: string[] }) {
  const fullText = lines.join('\n')
  const [charIndex, setCharIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setCharIndex((prev) => {
        const next = prev + 1
        if (next >= fullText.length) clearInterval(id)
        return Math.min(next, fullText.length)
      })
    }, TYPING_INTERVAL_MS)
    return () => clearInterval(id)
  }, [fullText])

  const isComplete = charIndex >= fullText.length
  const tokens = tokenizeCode(fullText)

  return (
    <div
      className="overflow-hidden rounded-[var(--radius)] border border-border font-mono text-sm"
      aria-live="polite"
      aria-atomic="false"
    >
      <div className="border-b border-border bg-[#1e1e1e] px-3 py-2 text-xs text-[#858585]">
        index.ts
      </div>
      <div className="min-h-[7.5rem] bg-[#1e1e1e] p-4">
        <pre className="m-0 min-h-[6rem] whitespace-pre-wrap break-all font-normal leading-relaxed">
          {tokens.map((t, idx) => {
            if (t.end <= charIndex) {
              return (
                <span key={idx} className={VSCODE_CLASS[t.type]}>
                  {fullText.slice(t.start, t.end)}
                </span>
              )
            }
            if (t.start < charIndex) {
              return (
                <span key={idx} className={VSCODE_CLASS[t.type]}>
                  {fullText.slice(t.start, charIndex)}
                </span>
              )
            }
            return null
          })}
          <span
            className={isComplete ? 'animate-pulse text-primary' : 'text-primary'}
            aria-hidden
          >
            |
          </span>
        </pre>
      </div>
    </div>
  )
}

const motionEnter = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: 'easeOut' as const },
}

const cardLinks = [
  { to: ROUTES.ABOUT, icon: User, ...welcomeSections.intro },
  { to: ROUTES.PROJECTS_LIST, icon: FolderGit2, ...welcomeSections.projects },
  { to: ROUTES.CONTACT, icon: Mail, ...welcomeSections.contact },
] as const

export function HomePage() {
  return (
    <>
      <Helmet>
        <title>{welcomeTitle}</title>
        <meta name="description" content={welcomeDescription} />
      </Helmet>
      <div className="container mx-auto max-w-4xl px-4 py-20 md:py-28">
        <motion.section
          {...motionEnter}
          className="relative mb-20 overflow-hidden rounded-[var(--radius)] border border-border bg-muted/10 py-16 pl-8 pr-8 md:mb-24 md:py-20 md:pl-14 md:pr-14"
          aria-labelledby="hero-title"
        >
          <span
            className="absolute left-0 top-0 h-24 w-px bg-primary/30"
            aria-hidden
          />
          <span
            className="absolute bottom-0 left-0 h-16 w-px bg-primary/20"
            aria-hidden
          />
          <span
            className="absolute right-6 top-6 h-px w-12 bg-border"
            aria-hidden
          />
          <span
            className="absolute bottom-8 right-0 h-px w-8 bg-border"
            aria-hidden
          />

          <div className="flex min-h-[36vh] flex-col justify-center text-center">
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground"
            >
              Portfolio
            </motion.p>
            <motion.h1
              id="hero-title"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, ease: 'easeOut', delay: 0.04 }}
              className="mt-4 text-6xl font-semibold tracking-tight md:text-7xl"
            >
              {welcomeTitle}
            </motion.h1>
            <motion.div
              initial={{ opacity: 0, scaleX: 0.6 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.28, ease: 'easeOut', delay: 0.1 }}
              className="mx-auto mt-6 flex items-center justify-center gap-2"
              aria-hidden
            >
              <span className="size-1.5 shrink-0 rounded-full bg-primary/50" />
              <span className="h-px w-16 rounded-full bg-primary/40 md:w-20" />
              <span className="size-1.5 shrink-0 rounded-full bg-primary/50" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: 0.14 }}
              className="mx-auto mt-3 flex gap-1.5"
              aria-hidden
            >
              {[1, 2, 3].map((i) => (
                <span
                  key={i}
                  className="size-1 rounded-full bg-muted-foreground/30"
                />
              ))}
            </motion.div>
            {heroRoleLabel && (
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, ease: 'easeOut', delay: 0.16 }}
                className="mt-5 text-base tracking-wide text-muted-foreground md:text-lg"
              >
                {heroRoleLabel}
              </motion.p>
            )}
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: 'easeOut', delay: 0.2 }}
              className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground md:mt-8 md:text-xl"
            >
              {welcomeDescription}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: 'easeOut', delay: 0.24 }}
              className="mt-10 flex flex-col items-center gap-6 md:mt-12"
            >
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-2 border-primary/40 bg-muted/30 text-foreground transition-colors hover:border-primary hover:bg-muted/50 hover:text-foreground"
              >
                <Link to={ROUTES.ABOUT}>{welcomeSections.intro.cta}</Link>
              </Button>
              <div className="flex flex-wrap justify-center gap-2">
                {skills.map((skill, i) => (
                  <motion.span
                    key={skill}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.22,
                      ease: 'easeOut',
                      delay: 0.28 + i * 0.03,
                    }}
                    className="rounded-[var(--radius)] border border-border bg-background/80 px-3 py-1.5 text-xs text-muted-foreground"
                  >
                    {skill}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.section>

        <motion.section
          {...motionEnter}
          transition={{ ...motionEnter.transition, delay: 0.05 }}
          className="mb-12"
          aria-label="코드 미리보기"
        >
          <TypingCodeBlock lines={welcomeCodeLines} />
        </motion.section>

        <motion.section
          {...motionEnter}
          transition={{ ...motionEnter.transition, delay: 0.06 }}
          className="border-t border-border pt-14 md:pt-16"
          aria-labelledby="welcome-cards-heading"
        >
          <h2
            id="welcome-cards-heading"
            className="mb-6 text-xs font-medium uppercase tracking-wider text-muted-foreground md:mb-8"
          >
            둘러보기
          </h2>
          <ul className="grid gap-4 sm:gap-5 md:grid-cols-3">
            {cardLinks.map((item, i) => {
              const Icon = item.icon
              return (
                <li key={item.to}>
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.3,
                      ease: 'easeOut',
                      delay: 0.08 + i * 0.04,
                    }}
                  >
                    <Link
                      to={item.to}
                      className={cn(
                        'group flex h-full flex-col rounded-[var(--radius)] border border-border bg-card p-6 text-left transition-colors',
                        'hover:border-primary/30 hover:bg-muted/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        'border-t-2 border-t-transparent hover:border-t-primary/40'
                      )}
                    >
                      <span
                        className="inline-flex size-9 items-center justify-center rounded-md border border-border bg-muted/30 text-muted-foreground transition-colors group-hover:border-primary/30 group-hover:text-primary"
                        aria-hidden
                      >
                        <Icon className="size-4" />
                      </span>
                      <span className="mt-4 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {item.label}
                      </span>
                      <p className="mt-2 flex-1 text-sm text-muted-foreground leading-relaxed">
                        {item.description}
                      </p>
                      <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-foreground group-hover:text-primary">
                        {item.cta}
                        <ChevronRight className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </Link>
                  </motion.div>
                </li>
              )
            })}
          </ul>
        </motion.section>
      </div>
    </>
  )
}
