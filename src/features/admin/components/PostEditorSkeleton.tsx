import styles from './PostEditor.module.css';
import skeleton from './PostEditorSkeleton.module.css';

export function PostEditorSkeleton() {
  return (
    <div className={`${styles.form} ${skeleton.skeleton}`} aria-hidden>
      <footer className={styles.footer}>
        <span className={`${styles.breadcrumb} ${skeleton.line}`} />
        <span className={`${styles.saveState} ${skeleton.line}`} />
        <div className={styles.submitArea}>
          <span className={`${styles.save} ${skeleton.button}`} />
          <span className={`${styles.submit} ${skeleton.button}`} />
        </div>
      </footer>
      <div className={styles.mainFields}>
        <label className={`${styles.field} ${styles.titleField}`}>
          <span>제목</span>
          <input disabled />
        </label>
        <label className={styles.field}>
          <span>설명</span>
          <textarea disabled rows={2} />
        </label>
      </div>
      <div className={styles.editorBlock}>
        <div className={styles.editorTabs}>
          <span className={skeleton.tab} />
          <span className={skeleton.tab} />
        </div>
        <div className={styles.toolbar}>
          {Array.from({ length: 6 }, (_, index) => (
            <span className={skeleton.tool} key={index} />
          ))}
        </div>
        <div className={styles.editorColumns}>
          <section className={styles.dropzone}>
            <textarea className={styles.body} disabled />
          </section>
        </div>
        <p className={styles.helper} />
      </div>
      <aside className={styles.settings}>
        <span className={`${skeleton.line} ${skeleton.heading}`} />
        {Array.from({ length: 3 }, (_, index) => (
          <span className={skeleton.settingRow} key={index} />
        ))}
        <span className={`${skeleton.line} ${skeleton.heading}`} />
        <span className={skeleton.cover} />
        <span className={skeleton.settingRow} />
        <span className={skeleton.settingRow} />
        <span className={`${skeleton.line} ${skeleton.details}`} />
      </aside>
    </div>
  );
}
