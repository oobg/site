'use client';

import { motion } from 'motion/react';
import { useIntro } from '@components/intro/IntroProvider';
import { ArrowLink } from '@components/ui/ArrowLink';
import { ROUTES } from '@constants/routes';
import { ProcessDiagram } from './ProcessDiagram';
import styles from './LandingHero.module.css';

/* 제목의 한 구절만 액센트로 집는다. 헤드라인 전체를 키우는 대신
   어디를 읽어야 하는지를 색으로 지목하는 쪽이 좁은 폭에서 더 잘 걸린다. */
export function LandingHero() {
  const { revealed } = useIntro();
  return (
    <motion.section
      className={styles.hero}
      initial={{ opacity: 0, y: 12 }}
      animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
      transition={{ duration: 0.2 }}
    >
      <div className={styles.copy}>
        <h1 className={styles.title}>
          Ideas deserve <span className={styles.em}>good interfaces.</span>
        </h1>
        <p className={styles.subtitle}>
          생각이 시스템이 되고, 시스템이 제품이 되는 과정을 기록합니다.
        </p>
        <div className={styles.cta}>
          <ArrowLink href={ROUTES.BLOG.LIST}>Explore my thinking</ArrowLink>
        </div>
      </div>
      <div className={styles.visual}>
        <ProcessDiagram />
      </div>
    </motion.section>
  );
}
