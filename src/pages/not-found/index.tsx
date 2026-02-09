import { motion } from 'framer-motion'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'

import { ROUTES } from '@/shared/config/routes'
import { Button } from '@/shared/ui/button'

export function NotFoundPage() {
  return (
    <>
      <Helmet>
        <title>404 · raven</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="container mx-auto max-w-4xl px-4 py-16 md:py-24">
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="space-y-6 text-center"
        >
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            404
          </h1>
          <p className="text-muted-foreground">
            요청한 페이지를 찾을 수 없습니다.
          </p>
          <Button asChild>
            <Link to={ROUTES.HOME}>홈으로</Link>
          </Button>
        </motion.section>
      </div>
    </>
  )
}
