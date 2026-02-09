import { Link, useLocation } from 'react-router-dom'

import { ThemeToggle } from '@/features/theme/theme-toggle'
import { ROUTES } from '@/shared/config/routes'
import { cn } from '@/shared/lib/utils'

const navItems = [
  { to: ROUTES.HOME, label: 'Home' },
  { to: ROUTES.ABOUT, label: 'About' },
  { to: ROUTES.PROJECTS_LIST, label: 'Projects' },
  { to: ROUTES.BLOG, label: 'Blog' },
  { to: ROUTES.CONTACT, label: 'Contact' },
] as const

export function Header() {
  const location = useLocation()

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
        <Link
          to={ROUTES.HOME}
          className="font-medium text-foreground no-underline hover:text-primary"
        >
          raven
        </Link>
        <nav className="flex items-center gap-6" aria-label="메인 네비게이션">
          {navItems.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                'text-sm font-medium transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded',
                location.pathname === to
                  ? 'text-foreground'
                  : 'text-muted-foreground'
              )}
            >
              {label}
            </Link>
          ))}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  )
}
