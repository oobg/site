import type { ReactNode } from 'react';
import styles from './Eyebrow.module.css';

/** 섹션 레이블. 본문 위에 붙어 "여기부터 무엇인지"를 알리는 상위 표지다.
    서체·자간·색은 여기서만 정한다 — 화면마다 다시 쓰면 그게 곧 시스템 단절이다.
    간격은 이 컴포넌트가 갖지 않는다. 호출부가 className으로 준다. */
export function Eyebrow({
  as: Tag = 'p',
  id,
  className,
  children,
}: {
  /** 목록의 제목 역할이면 'h2'를 준다. 기본은 장식이 아닌 단순 레이블(p). */
  as?: 'p' | 'h2' | 'h3';
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag id={id} className={className ? `${styles.eyebrow} ${className}` : styles.eyebrow}>
      {children}
    </Tag>
  );
}
