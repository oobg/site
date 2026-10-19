'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { unstable_rethrow } from 'next/navigation';
import { SignOut } from '@phosphor-icons/react';
import { signOutAction } from '@features/admin/services/auth.actions';
import styles from './AdminAccountMenu.module.css';

export function AdminAccountMenu({ userEmail }: { userEmail?: string }) {
  const [signOutPending, setSignOutPending] = useState(false);
  const [signOutError, setSignOutError] = useState('');
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const signOutRef = useRef<HTMLButtonElement>(null);
  const focusMenuOnOpenRef = useRef(false);
  const initial = userEmail?.trim().charAt(0).toUpperCase() || 'R';

  useEffect(() => {
    if (!open) return;

    if (focusMenuOnOpenRef.current) {
      focusMenuOnOpenRef.current = false;
      signOutRef.current?.focus();
    }

    const closeFromPointer = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeFromEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener('pointerdown', closeFromPointer);
    document.addEventListener('keydown', closeFromEscape);
    return () => {
      document.removeEventListener('pointerdown', closeFromPointer);
      document.removeEventListener('keydown', closeFromEscape);
    };
  }, [open]);

  return (
    <div
      className={styles.accountMenu}
      ref={containerRef}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        ref={triggerRef}
        className={styles.trigger}
        type="button"
        aria-label="계정 메뉴"
        aria-haspopup="menu"
        aria-controls={menuId}
        aria-expanded={open}
        onClick={() => {
          focusMenuOnOpenRef.current = !open;
          setOpen((current) => !current);
        }}
        onKeyDown={(event) => {
          if (event.key !== 'ArrowDown') return;
          event.preventDefault();
          if (open) {
            signOutRef.current?.focus();
          } else {
            focusMenuOnOpenRef.current = true;
            setOpen(true);
          }
        }}
      >
        <span aria-hidden>{initial}</span>
      </button>

      <div className={styles.menu} id={menuId} role="menu" hidden={!open}>
        {userEmail ? (
          <div className={styles.identity} role="presentation">
            <span>작성자 계정</span>
            <strong>{userEmail}</strong>
          </div>
        ) : null}
        <form
          action={async () => {
            if (signOutPending) return;
            setSignOutPending(true);
            setSignOutError('');
            try {
              await signOutAction();
            } catch (error) {
              unstable_rethrow(error);
              setSignOutError('로그아웃하지 못했어요. 연결을 확인하고 다시 시도해 주세요.');
            } finally {
              setSignOutPending(false);
            }
          }}
          role="none"
        >
          <button
            ref={signOutRef}
            className={styles.menuItem}
            type="submit"
            role="menuitem"
            disabled={signOutPending}
          >
            <SignOut aria-hidden size={17} weight="bold" />
            {signOutPending ? '로그아웃 중…' : '로그아웃'}
          </button>
        </form>
        {signOutError ? (
          <p className={styles.error} role="alert">
            {signOutError}
          </p>
        ) : null}
      </div>
    </div>
  );
}
