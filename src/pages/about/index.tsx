import { motion } from 'framer-motion'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'

import { ROUTES } from '@/shared/config/routes'
import { Button } from '@/shared/ui/button'

export function AboutPage() {
  return (
    <>
      <Helmet>
        <title>About · raven</title>
        <meta name="description" content="About 페이지." />
      </Helmet>
      <div className="container mx-auto max-w-4xl px-4 py-16 md:py-24">
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="space-y-8"
        >
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            About
          </h1>
          <p className="max-w-xl text-muted-foreground">
            포트폴리오 소개 및 간단한 경력·스킬 요약을 둘 수 있는 공간입니다.
          </p>
          <div>
            <Button asChild variant="outline">
              <Link to={ROUTES.CONTACT}>Contact</Link>
            </Button>
          </div>
        </motion.section>
      </div>
    </>
  )
}
