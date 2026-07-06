'use client';

import { useState, useSyncExternalStore } from 'react';
import { Check, LinkSimple, ShareNetwork } from '@phosphor-icons/react';
import styles from './ShareButtons.module.css';

const noopSubscribe = () => () => {};

export function ShareButtons({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  // 서버 렌더에서는 항상 false로 두고(하이드레이션 mismatch 방지), 클라이언트에서만 실제 지원 여부를 읽는다.
  const canNativeShare = useSyncExternalStore(
    noopSubscribe,
    () => typeof navigator !== 'undefined' && typeof navigator.share === 'function',
    () => false,
  );

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  async function shareNative() {
    try {
      await navigator.share({ title, url: window.location.href });
    } catch {
      /* 사용자가 공유 시트를 닫은 경우 */
    }
  }

  return (
    <div className={styles.share}>
      <button
        type="button"
        className={styles.btn}
        onClick={copyLink}
        aria-label={copied ? '링크가 복사됨' : '링크 복사'}
      >
        {copied ? <Check size={18} weight="bold" /> : <LinkSimple size={18} />}
      </button>
      {canNativeShare ? (
        <button type="button" className={styles.btn} onClick={shareNative} aria-label="공유하기">
          <ShareNetwork size={18} />
        </button>
      ) : null}
    </div>
  );
}
