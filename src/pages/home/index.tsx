import { motion } from 'framer-motion'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'

import { ROUTES } from '@/shared/config/routes'
import { Button } from '@/shared/ui/button'

export function HomePage() {
  return (
    <>
      <Helmet>
        <title>raven</title>
        <meta name="description" content="개인 포트폴리오, 채용용, 사이드 프로젝트 쇼케이스." />
      </Helmet>
      <div className="container mx-auto max-w-4xl px-4 py-16 md:py-24">
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="space-y-8"
        >
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            raven
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            개인 포트폴리오, 채용용, 사이드 프로젝트 쇼케이스.
          </p>
          <div>
            <Button asChild>
              <Link to={ROUTES.PROJECTS_LIST}>Projects 보기</Link>
            </Button>
          </div>
        </motion.section>
      </div>
    </>
  )
}
