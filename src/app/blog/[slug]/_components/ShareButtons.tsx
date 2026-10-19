'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Check, LinkSimple, ShareNetwork } from '@phosphor-icons/react';
import { Toast } from '@lib/toast';
import { createBlogShareUrl } from '@lib/analytics/share-url';
import { trackPublicEvent } from '@lib/analytics/events';
import styles from './ShareButtons.module.css';

const noopSubscribe = () => () => {};

export function ShareButtons({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const resetTimer = useRef<number>(undefined);
  const mounted = useRef(true);
  // 서버 렌더에서는 항상 false로 두고(하이드레이션 mismatch 방지), 클라이언트에서만 실제 지원 여부를 읽는다.
  const canNativeShare = useSyncExternalStore(
    noopSubscribe,
    () => typeof navigator !== 'undefined' && typeof navigator.share === 'function',
    () => false,
  );

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      window.clearTimeout(resetTimer.current);
    };
  }, []);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(createBlogShareUrl(window.location.href, 'copy'));
      if (!mounted.current) return;
      setCopied(true);
      trackPublicEvent('article_share', 'copy');
      setAnnouncement('글 링크를 복사했어요.');
      window.clearTimeout(resetTimer.current);
      resetTimer.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      if (mounted.current) {
        setCopied(false);
        setAnnouncement('복사 권한을 확인하거나 주소창에서 글 주소를 직접 복사해 주세요.');
        Toast.error('링크를 복사하지 못했어요. 다시 시도해 주세요.');
      }
    }
  }

  async function shareNative() {
    try {
      await navigator.share({
        title,
        url: createBlogShareUrl(window.location.href, 'native_share'),
      });
      if (mounted.current) {
        setAnnouncement('글 공유를 완료했어요.');
        trackPublicEvent('article_share', 'native_share');
      }
    } catch (error) {
      const cancelled =
        typeof error === 'object' &&
        error !== null &&
        'name' in error &&
        error.name === 'AbortError';
      if (mounted.current && !cancelled) {
        setAnnouncement('공유하지 못했어요. 링크 복사로 다시 시도해 주세요.');
        Toast.error('공유하지 못했어요. 다시 시도해 주세요.');
      }
    }
  }

  return (
    <div>
      <div className={styles.share}>
        <button
          type="button"
          className={styles.btn}
          onClick={copyLink}
          aria-label={copied ? '링크가 복사됨' : '링크 복사'}
        >
          {copied ? <Check size={18} weight="bold" /> : <LinkSimple size={18} />}
          <span aria-hidden="true">{copied ? '복사됨' : '링크 복사'}</span>
        </button>
        {canNativeShare ? (
          <button type="button" className={styles.btn} onClick={shareNative} aria-label="공유하기">
            <ShareNetwork size={18} />
            <span aria-hidden="true">공유하기</span>
          </button>
        ) : null}
      </div>
      <p className={styles.feedback} role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
    </div>
  );
}
