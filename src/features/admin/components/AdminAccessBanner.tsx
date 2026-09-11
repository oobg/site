'use client';

import { useSyncExternalStore } from 'react';
import { WarningCircle, X } from '@phosphor-icons/react';
import { GoogleLoginButton } from '@features/admin/components/GoogleLoginButton';
import type { OwnerAccess } from '@lib/auth/owner';
import styles from './AdminAccessBanner.module.css';

export const ADMIN_BANNER_DISMISSED_KEY = 'raven:admin-access-banner-dismissed';
const ADMIN_BANNER_DISMISSED_EVENT = 'raven:admin-access-banner-dismissed-change';
let dismissedWithoutStorage = false;

function subscribeToDismissal(onStoreChange: () => void) {
  window.addEventListener('storage', onStoreChange);
  window.addEventListener(ADMIN_BANNER_DISMISSED_EVENT, onStoreChange);
  return () => {
    window.removeEventListener('storage', onStoreChange);
    window.removeEventListener(ADMIN_BANNER_DISMISSED_EVENT, onStoreChange);
  };
}

function getDismissedSnapshot() {
  try {
    return sessionStorage.getItem(ADMIN_BANNER_DISMISSED_KEY) === '1';
  } catch {
    return dismissedWithoutStorage;
  }
}

function getServerDismissedSnapshot() {
  return false;
}

export function AdminAccessBanner({ access }: { access: OwnerAccess }) {
  const dismissed = useSyncExternalStore(
    subscribeToDismissal,
    getDismissedSnapshot,
    getServerDismissedSnapshot,
  );
  const state = access.authorized ? 'authorized' : access.authenticated ? 'denied' : 'signed-out';

  if (access.authorized && dismissed) return null;

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
        {access.authorized ? (
          <button
            className={styles.dismiss}
            type="button"
            aria-label="관리자 안내 닫기"
            onClick={() => {
              try {
                sessionStorage.setItem(ADMIN_BANNER_DISMISSED_KEY, '1');
              } catch {
                // The current page can still dismiss the notice when storage is unavailable.
                dismissedWithoutStorage = true;
              }
              window.dispatchEvent(new Event(ADMIN_BANNER_DISMISSED_EVENT));
            }}
          >
            <X aria-hidden size={16} weight="bold" />
          </button>
        ) : null}
      </div>
    </section>
  );
}
