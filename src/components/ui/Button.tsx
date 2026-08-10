import type { ReactNode } from 'react';
import styles from './Button.module.css';

/** 상태를 바꾸는 동작용 버튼. 이동은 ArrowLink가 맡는다. */
export function Button({
  type = 'button',
  onClick,
  children,
}: {
  type?: 'button' | 'submit';
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button type={type} className={styles.button} onClick={onClick}>
      {children}
    </button>
  );
}
