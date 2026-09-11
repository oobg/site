import { CodeCopy } from './CodeCopy';
import styles from './ArticleBody.module.css';

export function ArticleBody({ html }: { html: string }) {
  return (
    <>
      <div
        className={styles.prose}
        data-article-body=""
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {/* 복사 버튼 마크업은 서버가 심고 동작만 여기서 붙는다. 본문이 있는 화면에만
          클라이언트 코드가 실려, 목록·랜딩은 RSC 그대로 남는다. */}
      <CodeCopy />
    </>
  );
}
