import { UploadSimple } from '@phosphor-icons/react/dist/ssr';
import styles from './PostEditor.module.css';
import skeleton from './PostEditorSkeleton.module.css';

export function PostEditorSkeleton() {
  return (
    <div className={`${styles.form} ${skeleton.skeleton}`} aria-hidden>
      <div className={styles.mainFields}>
        <h2 className={styles.groupHeading}>기본 정보</h2>
        <label className={`${styles.field} ${styles.titleField}`}>
          <span>제목</span>
          <input disabled />
        </label>
        <label className={`${styles.field} ${styles.wide}`}>
          <span>설명</span>
          <textarea disabled rows={3} />
        </label>
      </div>
      <div className={styles.editorBlock}>
        <div className={styles.editorHeading}>
          <div>
            <label>본문</label>
            <p>Markdown으로 작성해요.</p>
          </div>
          <label className={styles.uploadButton}>
            <UploadSimple aria-hidden size={17} weight="bold" />
            이미지 선택
            <input type="file" disabled />
          </label>
        </div>
        <div className={styles.toolbar}>
          <button disabled>H2</button>
          <button disabled>B</button>
          <button disabled>링크</button>
          <button disabled>인용</button>
          <button disabled>코드</button>
        </div>
        <div className={styles.editorTabs}>
          <button disabled>작성</button>
          <button disabled>미리보기</button>
        </div>
        <div className={styles.editorColumns}>
          <section className={styles.dropzone}>
            <textarea className={styles.body} disabled />
          </section>
        </div>
        <p className={styles.helper} />
      </div>
      <aside className={styles.settings}>
        <h2 className={styles.groupHeading}>발행 설정</h2>
        <div className={skeleton.rail} />
      </aside>
      <footer className={styles.footer}>
        <div className={styles.submitArea}>
          <span className={styles.saveState} />
          <button className={styles.submit} disabled>
            저장
          </button>
        </div>
      </footer>
    </div>
  );
}
