import type { CSSProperties } from 'react';
import styles from './Skeleton.module.css';

/**
 * 로딩 자리표시 블록. 좌→우 shimmer 스윕(순수 CSS, RSC 친화).
 * 실제 콘텐츠 자리를 잡아 레이아웃 시프트를 줄인다.
 * reduced-motion에서는 스윕 없이 정지한다.
 *
 * width/height/radius는 토큰·rem·% 등 CSS 길이값을 그대로 받는다(raw px 지양).
 */
export function Skeleton({
  width,
  height,
  radius,
  className,
}: {
  width?: CSSProperties['width'];
  height?: CSSProperties['height'];
  radius?: CSSProperties['borderRadius'];
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={className ? `${styles.skeleton} ${className}` : styles.skeleton}
      style={{ width, height, borderRadius: radius }}
    />
  );
}
