'use client';

import { motion } from 'motion/react';
import { useIntro } from '@components/intro/IntroProvider';
import { ArrowLink } from '@components/ui/ArrowLink';
import { ROUTES } from '@constants/routes';
import { ProcessDiagram } from './ProcessDiagram';
import styles from './LandingHero.module.css';

/* 배경 블록 없이 조판만으로 무게를 잡는 히어로.
   헤드라인이 화면 폭을 쓰고, 그 아래 리드와 다이어그램이 좌우로 갈린다. */
export function LandingHero() {
  const { revealed } = useIntro();
  return (
    <motion.section
      className={styles.hero}
      initial={{ opacity: 0, y: 12 }}
      animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
      transition={{ duration: 0.2 }}
    >
      <h1 className={styles.headline}>Ideas deserve good interfaces.</h1>
      <div className={styles.row}>
        <div className={styles.lede}>
          <p className={styles.sub}>
            생각이 시스템이 되고, 시스템이 제품이 되는 과정을 기록합니다.
          </p>
          <ArrowLink href={ROUTES.BLOG.LIST}>Explore my thinking</ArrowLink>
        </div>
        <ProcessDiagram />
      </div>
    </motion.section>
  );
}
