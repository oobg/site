'use client';

import { useEffect } from 'react';

/** 복사됨 표시를 되돌리기까지. 짧으면 못 보고, 길면 다음 블록을 복사할 때 겹친다. */
const RESET_MS = 1600;

/**
 * 코드블럭 복사 버튼의 동작.
 *
 * 버튼 마크업은 서버에서 rehype가 심는다(본문이 raw HTML이라 React 컴포넌트를
 * 넣을 수 없다). 여기서는 클릭을 위임으로 받아 동작만 붙인다. 블록이 몇 개든
 * 리스너는 하나이고, 본문이 바뀌어도 다시 붙일 필요가 없다.
 */
export function CodeCopy() {
  useEffect(() => {
    const timers = new Map<HTMLButtonElement, number>();
    let active = true;

    const onClick = async (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const button = target.closest<HTMLButtonElement>('button[data-code-copy]');
      if (!button) return;

      const code = button.closest('figure[data-code]')?.querySelector('code');
      if (!code) return;

      try {
        await navigator.clipboard.writeText(code.textContent ?? '');
      } catch {
        /* 권한이 없거나 보안 컨텍스트가 아니면 아무 표시도 하지 않는다.
           복사되지 않았는데 복사됨이라고 하는 것이 가장 나쁘다. */
        return;
      }

      // 클립보드 작업 중 페이지를 떠났다면 분리된 버튼과 새 타이머를 만들지 않는다.
      if (!active || !button.isConnected) return;

      const status = button.querySelector('[data-code-copy-status]');
      button.setAttribute('data-copied', '');
      if (status) status.textContent = '복사됨';

      window.clearTimeout(timers.get(button));
      timers.set(
        button,
        window.setTimeout(() => {
          button.removeAttribute('data-copied');
          if (status) status.textContent = '코드 복사';
          timers.delete(button);
        }, RESET_MS),
      );
    };

    document.addEventListener('click', onClick);
    return () => {
      active = false;
      document.removeEventListener('click', onClick);
      for (const id of timers.values()) window.clearTimeout(id);
    };
  }, []);

  return null;
}
