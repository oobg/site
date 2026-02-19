/** 페이지/섹션 entrance: opacity 0→1, y 8→0. 규칙: 0.25–0.35s, ease-out. */
export const motionEnter = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: "easeOut" as const },
};
