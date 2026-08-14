'use client';

import { useEffect, useRef } from 'react';
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
  const heroRef = useRef<HTMLElement>(null);

  /* 잔광은 마크의 광원이 배경으로 새어 나온 것이라 같은 포인터를 따라야 한다.
     마크만 따라가고 잔광이 멈춰 있으면 광원이 둘로 갈라져 보인다. */
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let raf = 0;
    const target = { x: 0.58, y: 0.38 };
    const at = { x: 0.58, y: 0.38 };

    /* 목표를 향해 조금씩 따라간다. 포인터 좌표를 그대로 꽂으면 빛이 커서에
       붙어 다니면서 툭툭 끊긴다. 빛은 질량이 있는 것처럼 늦게 도착해야 한다. */
    const tick = () => {
      const dx = target.x - at.x;
      const dy = target.y - at.y;
      at.x += dx * 0.1;
      at.y += dy * 0.1;
      hero.style.setProperty('--bloom-x', `${(at.x * 100).toFixed(1)}%`);
      hero.style.setProperty('--bloom-y', `${(at.y * 100).toFixed(1)}%`);
      raf = Math.abs(dx) > 0.001 || Math.abs(dy) > 0.001 ? requestAnimationFrame(tick) : 0;
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      const rect = hero.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      /* 히어로를 벗어나면 빛을 끈다. 켜고 끄는 것은 opacity라 합성 단계에서 끝나고,
         위치는 계속 따라가므로 다시 들어왔을 때 엉뚱한 데서 켜지지 않는다. */
      hero.dataset.lit = x >= 0 && x <= 1 && y >= 0 && y <= 1 ? 'on' : 'off';
      target.x = Math.max(-0.2, Math.min(1.2, x));
      target.y = Math.max(-0.2, Math.min(1.2, y));
      if (!raf) raf = requestAnimationFrame(tick);
    };

    /* 창 밖으로 나가도 꺼야 한다 — pointermove가 더는 오지 않으므로 켜진 채 남는다. */
    const onLeave = () => {
      hero.dataset.lit = 'off';
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <motion.section
      ref={heroRef}
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
