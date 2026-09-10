import { SignOut, WarningCircle } from '@phosphor-icons/react/dist/ssr';
import { GoogleLoginButton } from '@features/admin/components/GoogleLoginButton';
import { signOutAction } from '@features/admin/services/auth.actions';
import type { OwnerAccess } from '@lib/auth/owner';
import styles from './AdminAccessBanner.module.css';

export function AdminAccessBanner({ access }: { access: OwnerAccess }) {
  const state = access.authorized ? 'authorized' : access.authenticated ? 'denied' : 'signed-out';

  return (
    <section className={styles.banner} data-state={state} aria-labelledby="admin-access-title">
      <div className={styles.copy}>
        <div className={styles.eyebrow}>
          {state === 'denied' ? <WarningCircle aria-hidden size={17} weight="bold" /> : null}
          <h2 id="admin-access-title">
            {state === 'denied' ? '권한이 없어요' : '관리자 페이지에요'}
          </h2>
        </div>
        <p>
          {state === 'authorized'
            ? `${access.email ?? '작성자 계정'}으로 로그인했어요.`
            : state === 'denied'
              ? `${access.email ?? '현재 계정'}은 등록된 작성자 계정이 아니에요.`
              : access.configured
                ? '등록된 Google 작성자 계정으로 로그인해 주세요.'
                : '관리자에게 로그인과 콘텐츠 저장소 설정을 확인해 달라고 요청해 주세요.'}
        </p>
      </div>

      <div className={styles.actions}>
        {!access.authenticated && access.configured ? <GoogleLoginButton /> : null}
        {access.authenticated && !access.authorized ? <GoogleLoginButton /> : null}
        {access.authenticated ? (
          <form action={signOutAction}>
            <button className={styles.signOut} type="submit" aria-label="로그아웃">
              <SignOut aria-hidden size={16} weight="bold" />
              <span className={styles.signOutLabel}>로그아웃</span>
            </button>
          </form>
        ) : null}
      </div>
    </section>
  );
}
