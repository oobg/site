import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('loadGoogleIdentityScript', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetModules();
    document.head.querySelectorAll('script').forEach((script) => script.remove());
    delete window.google;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('로드 이벤트가 오지 않으면 timeout 후 script를 치우고 다음 호출에서 새로 시도한다', async () => {
    const { loadGoogleIdentityScript } = await import('@lib/google/identity');
    const firstLoad = loadGoogleIdentityScript();
    const firstScript = document.head.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]',
    );
    expect(firstScript).not.toBeNull();

    const rejection = expect(firstLoad).rejects.toThrow(
      'Google Identity Services를 불러오지 못했습니다.',
    );
    await vi.advanceTimersByTimeAsync(15_000);
    await rejection;
    expect(document.head.contains(firstScript)).toBe(false);

    void loadGoogleIdentityScript();
    const retryScript = document.head.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]',
    );
    expect(retryScript).not.toBeNull();
    expect(retryScript).not.toBe(firstScript);
  });
});
