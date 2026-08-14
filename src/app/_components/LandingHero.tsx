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
  const bloomRef = useRef<HTMLSpanElement>(null);

  /* 잔광은 마크의 광원이 배경으로 새어 나온 것이라 같은 포인터를 따라야 한다.
     마크만 따라가고 잔광이 멈춰 있으면 광원이 둘로 갈라져 보인다. */
  useEffect(() => {
    const hero = heroRef.current;
    const bloom = bloomRef.current;
    if (!hero || !bloom) return;
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
      /* 비율은 잔광 상자 기준으로 잰다. --bloom-x가 그 상자의 퍼센트로 해석되기
         때문이다. 히어로 기준으로 재면 상자가 더 커서 좌표가 어긋나고, 가장자리로
         갈수록 오차가 커져 빛이 화면 밖으로 날아간다. */
      const box = bloom.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width;
      const y = (event.clientY - box.top) / box.height;
      const heroRect = hero.getBoundingClientRect();
      const heroY = (event.clientY - heroRect.top) / heroRect.height;
      /* 켜고 끄는 판정은 세로로만 한다. 히어로 상자는 컨테이너 여백 안쪽이라
         가로까지 보면 포인터가 좌우 여백에 들어서는 순간 빛이 꺼진다 — 화면상
         그 자리도 히어로의 일부인데 벽이 생긴 것처럼 보인다.
         스크롤로 히어로를 지나갈 때만 잦아들면 된다. */
      hero.dataset.lit = heroY >= -0.12 && heroY <= 1.12 ? 'on' : 'off';
      /* 컨테이너 여백 밖까지 따라간다. 여기서 좁게 묶으면 빛이 여백 경계에서
         멈춰 벽에 부딪힌 것처럼 보인다. */
      target.x = Math.max(-0.1, Math.min(1.1, x));
      target.y = Math.max(-0.1, Math.min(1.1, y));
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
      <span className={styles.bloom} ref={bloomRef} aria-hidden />
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
