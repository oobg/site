import type { ReactNode } from 'react';
import { Container } from '@components/layout/Container';
import { Eyebrow } from '@components/ui/Eyebrow';
import styles from './StatusScreen.module.css';

/** 404·에러처럼 콘텐츠 대신 상태를 알리는 화면. 본문 화면과 같은 조판을 쓴다. */
export function StatusScreen({
  code,
  title,
  description,
  action,
}: {
  /** 화면 맨 위에 놓이는 상태 코드. 예: 404, ERROR */
  code: string;
  title: string;
  description: string;
  action: ReactNode;
}) {
  return (
    <Container>
      <div className={styles.screen}>
        <Eyebrow>{code}</Eyebrow>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.description}>{description}</p>
        <div className={styles.action}>{action}</div>
      </div>
    </Container>
  );
}
