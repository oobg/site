'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@lib/supabase/browser';
import {
  generateGoogleNonce,
  getGoogleAccountsId,
  getGoogleClientId,
  loadGoogleIdentityScript,
  type GoogleCredentialResponse,
} from '@lib/google/identity';
import styles from './GoogleLoginButton.module.css';

type Status = 'loading' | 'ready' | 'signing-in' | 'error' | 'not-configured';

export function GoogleLoginButton() {
  const router = useRouter();
  const hostRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;

    const initialize = async () => {
      const clientId = getGoogleClientId();
      if (!clientId) {
        if (active) setStatus('not-configured');
        return;
      }

      setStatus('loading');
      setErrorMessage(null);

      try {
        await loadGoogleIdentityScript();
        const accountsId = getGoogleAccountsId();
        const host = hostRef.current;
        if (!active || !accountsId || !host) {
          if (active) throw new Error('Google 로그인 API를 사용할 수 없습니다.');
          return;
        }

        const { nonce, hashedNonce } = await generateGoogleNonce();
        if (!active) return;
        let credentialUsed = false;

        accountsId.initialize({
          client_id: clientId,
          nonce: hashedNonce,
          use_fedcm_for_button: true,
          button_auto_select: false,
          auto_select: false,
          callback: async (response: GoogleCredentialResponse) => {
            if (credentialUsed || !active) return;
            credentialUsed = true;
            setStatus('signing-in');
            setErrorMessage(null);

            try {
              if (!response.credential) throw new Error('Google 계정 정보를 받지 못했습니다.');
              const supabase = createClient();
              const { error } = await supabase.auth.signInWithIdToken({
                provider: 'google',
                token: response.credential,
                nonce,
              });
              if (error) throw error;
              if (active) router.refresh();
            } catch {
              if (!active) return;
              setStatus('error');
              setErrorMessage('Google 로그인에 실패했습니다. 다시 시도해 주세요.');
            }
          },
        });

        host.replaceChildren();
        const width = Math.max(220, Math.min(400, Math.round(host.getBoundingClientRect().width)));
        accountsId.renderButton(host, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: String(width),
          locale: 'ko',
        });
        setStatus('ready');
      } catch {
        if (!active) return;
        setStatus('error');
        setErrorMessage('Google 로그인을 불러오지 못했습니다. 다시 시도해 주세요.');
      }
    };

    void Promise.resolve().then(initialize);
    return () => {
      active = false;
    };
  }, [attempt, router]);

  if (status === 'not-configured') {
    return (
      <p className={styles.message} role="alert">
        Google 로그인 설정이 필요합니다.
      </p>
    );
  }

  return (
    <div className={styles.login} data-status={status}>
      <div
        ref={hostRef}
        className={styles.buttonHost}
        aria-busy={status === 'loading' || status === 'signing-in'}
        inert={status === 'signing-in' ? true : undefined}
      />
      {status === 'loading' || status === 'signing-in' ? (
        <p className={styles.message} role="status">
          {status === 'loading' ? 'Google 로그인을 불러오는 중입니다.' : '로그인 중입니다.'}
        </p>
      ) : null}
      {errorMessage ? (
        <div className={styles.retry} role="alert">
          <p>{errorMessage}</p>
          <button type="button" onClick={() => setAttempt((value) => value + 1)}>
            다시 시도
          </button>
        </div>
      ) : null}
    </div>
  );
}
