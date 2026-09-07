'use client';

export type GoogleCredentialResponse = {
  credential?: string;
};

type GoogleAccountsId = {
  initialize(config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    nonce: string;
    use_fedcm_for_button?: boolean;
    button_auto_select?: boolean;
    auto_select?: boolean;
  }): void;
  renderButton(
    parent: HTMLElement,
    options: {
      type: 'standard';
      theme: 'outline';
      size: 'large';
      text: 'continue_with';
      shape: 'rectangular';
      logo_alignment: 'left';
      width: string;
      locale: 'ko';
    },
  ): void;
};

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
  }
}

const GSI_SRC = 'https://accounts.google.com/gsi/client';
const GSI_LOAD_TIMEOUT_MS = 15_000;
let loadPromise: Promise<void> | null = null;

export function getGoogleClientId(): string | null {
  return process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() || null;
}

export function loadGoogleIdentityScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SRC}"]`);
    const script = existing ?? document.createElement('script');
    let settled = false;

    const cleanup = () => {
      window.clearTimeout(timeoutId);
      script.removeEventListener('load', loaded);
      script.removeEventListener('error', fail);
    };

    const fail = () => {
      if (settled) return;
      settled = true;
      cleanup();
      script.remove();
      loadPromise = null;
      reject(new Error('Google Identity Services를 불러오지 못했습니다.'));
    };
    const loaded = () => {
      if (settled) return;
      if (!window.google?.accounts?.id) {
        fail();
        return;
      }
      settled = true;
      cleanup();
      resolve();
    };
    const timeoutId = window.setTimeout(fail, GSI_LOAD_TIMEOUT_MS);

    script.addEventListener('load', loaded);
    script.addEventListener('error', fail);
    if (!existing) {
      script.src = GSI_SRC;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  });

  return loadPromise;
}

/** Google에는 SHA-256 hex를, Supabase에는 원문을 보내는 nonce 쌍이다. */
export async function generateGoogleNonce(): Promise<{ nonce: string; hashedNonce: string }> {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const nonce = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(nonce));
  const hashedNonce = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
  return { nonce, hashedNonce };
}

export function getGoogleAccountsId(): GoogleAccountsId | null {
  return window.google?.accounts?.id ?? null;
}
