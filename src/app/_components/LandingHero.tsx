'use client';

import { motion } from 'motion/react';
import styles from './LandingHero.module.css';

export function LandingHero() {
  return (
    <motion.section
      className={styles.hero}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <h1 className={styles.headline}>Ideas deserve good interfaces.</h1>
      <p className={styles.sub}>생각이 시스템이 되고, 시스템이 제품이 되는 과정을 기록합니다.</p>
    </motion.section>
  );
}
