import { ShieldWarning } from '@phosphor-icons/react/dist/ssr';
import styles from './AccessPanel.module.css';

export function AccessPanel({ email }: { email: string | null }) {
  return (
    <div className={styles.panel} role="alert">
      <ShieldWarning aria-hidden size={24} weight="bold" />
      <div>
        <h2>이 계정은 접근할 수 없어요</h2>
        <p>
          {email ? `${email} 계정` : '현재 계정'}은 관리자 목록에 없습니다. 허용된 Google 계정으로
          다시 로그인해 주세요.
        </p>
      </div>
    </div>
  );
}
