import { Wrench } from '@phosphor-icons/react/dist/ssr';
import { GoogleLoginButton } from './GoogleLoginButton';
import styles from './LoginPanel.module.css';

export function LoginPanel({ configured }: { configured: boolean }) {
  return (
    <div className={styles.panel}>
      {configured ? (
        <>
          <div>
            <h2 className={styles.heading}>작성자 계정으로 로그인</h2>
            <p className={styles.copy}>허용된 Google 계정만 글을 작성하고 공개할 수 있어요.</p>
          </div>
          <GoogleLoginButton />
        </>
      ) : (
        <div className={styles.setup} role="status">
          <Wrench aria-hidden size={22} weight="bold" />
          <div>
            <h2 className={styles.heading}>관리자 연결이 필요해요</h2>
            <p className={styles.copy}>
              관리자에게 로그인과 콘텐츠 저장소 설정을 확인해 달라고 요청해 주세요.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
