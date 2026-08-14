'use client';

import { motion } from 'motion/react';
import { useIntro } from '@components/intro/IntroProvider';
import { RavenMark } from '@components/brand/RavenMark';
import { ROUTES } from '@constants/routes';
import Link from 'next/link';
import styles from './LandingHero.module.css';

/* 히어로의 주인공은 브랜드 마크다. 문장은 무엇을 하는 사람인지만 말하고 비켜선다.
   전에는 큰 글자가 추상적이고 작은 글자가 실제 내용을 말해 위계가 뒤집혀 있었다. */
export function LandingHero() {
  const { revealed } = useIntro();
  return (
    <motion.section
      className={styles.hero}
      initial={{ opacity: 0, y: 12 }}
      animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
      transition={{ duration: 0.2 }}
    >
      <span className={styles.bloom} aria-hidden />
      <div className={styles.copy}>
        <p className={styles.eyebrow}>
          <i aria-hidden />
          배윤석
        </p>
        {/* JSX가 줄바꿈 앞뒤 공백을 지워서 <br /> 양쪽 글자가 붙는다. 눈으로는 두 줄로
            보여도 접근성 이름은 "…화면까지혼자…"가 되어 한 덩어리로 읽힌다. */}
        <h1 className={styles.title}>
          서버부터 화면까지 <br />
          <em>혼자 만듭니다.</em>
        </h1>
        <p className={styles.subtitle}>만들면서 남은 기록을 여기 둡니다.</p>
        <Link className={styles.enter} href={ROUTES.BLOG.LIST}>
          쓴 글 보기 <span aria-hidden>→</span>
        </Link>
      </div>
      <RavenMark />
    </motion.section>
  );
}
