import { Link } from 'react-router-dom'

import { ROUTES } from '@/shared/config/routes'

export function Footer() {
  return (
    <footer className="border-t border-border py-8">
      <div className="container mx-auto max-w-4xl px-4 text-center text-sm text-muted-foreground">
        <Link
          to={ROUTES.HOME}
          className="hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        >
          raven
        </Link>
        {' · '}
        <span>raven.kr</span>
      </div>
    </footer>
  )
}
