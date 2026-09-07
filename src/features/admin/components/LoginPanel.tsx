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
              Supabase Google 로그인과 콘텐츠 저장소 환경 변수를 설정한 뒤 다시 열어 주세요.
            </p>
            <code className={styles.code}>
              NEXT_PUBLIC_SUPABASE_URL{`\n`}NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY{`\n`}
              NEXT_PUBLIC_GOOGLE_CLIENT_ID{`\n`}CMS_OWNER_EMAILS{`\n`}R2_ACCOUNT_ID /
              R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY
              {`\n`}R2_BUCKET / R2_PUBLIC_URL
            </code>
          </div>
        </div>
      )}
    </div>
  );
}
