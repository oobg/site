'use client';

import { useEffect } from 'react';

let diagramId = 0;
let mermaidPromise: Promise<(typeof import('mermaid'))['default']> | null = null;

function mermaidApi() {
  mermaidPromise ??= import('mermaid')
    .then(({ default: mermaid }) => {
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        flowchart: { htmlLabels: false },
        suppressErrorRendering: true,
        theme: 'base',
      });
      return mermaid;
    })
    .catch((error: unknown) => {
      // A transient chunk failure must not poison every later diagram on the page.
      mermaidPromise = null;
      throw error;
    });
  return mermaidPromise;
}

const safeResource = (value: string) => {
  const compact = value.replace(/[\u0000-\u0020\u007f]+/g, '');
  if (compact.startsWith('#')) return true;
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(compact)?.[1]?.toLowerCase();
  return scheme === 'http' || scheme === 'https';
};

/** Mermaid의 strict 출력에 한 번 더 경계를 둔다. 원고가 만든 이벤트·임베드·실행 URL은
    결과 SVG에 남기지 않고, 마커가 쓰는 같은 문서의 #id 참조만 허용한다. */
function sanitizeSvg(value: string) {
  const document = new DOMParser().parseFromString(value, 'image/svg+xml');
  const svg = document.documentElement;
  if (svg.localName !== 'svg' || document.querySelector('parsererror')) {
    throw new Error('Mermaid did not return an SVG.');
  }

  const blockedElements = new Set([
    'script',
    'foreignobject',
    'iframe',
    'object',
    'embed',
    'audio',
    'video',
  ]);
  document.querySelectorAll('*').forEach((element) => {
    if (blockedElements.has(element.localName.toLowerCase())) {
      element.remove();
      return;
    }
    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      if (name.startsWith('on')) element.removeAttribute(attribute.name);
      if (
        (name === 'href' || name === 'xlink:href' || name === 'src') &&
        !safeResource(attribute.value)
      ) {
        element.removeAttribute(attribute.name);
      }
      if (name === 'style') {
        const references = Array.from(attribute.value.matchAll(/url\(([^)]+)\)/gi), (match) =>
          match[1].trim().replace(/^['"]|['"]$/g, ''),
        );
        if (
          attribute.value.includes('@') ||
          references.some((reference) => !reference.startsWith('#'))
        ) {
          element.removeAttribute(attribute.name);
        }
      }
    }
  });
  document.querySelectorAll('style').forEach((style) => {
    const css = style.textContent ?? '';
    const references = Array.from(css.matchAll(/url\(([^)]+)\)/gi), (match) =>
      match[1].trim().replace(/^['"]|['"]$/g, ''),
    );
    if (css.includes('@') || references.some((reference) => !reference.startsWith('#'))) {
      style.remove();
    }
  });

  return new XMLSerializer().serializeToString(svg);
}

async function renderDiagram(figure: HTMLElement) {
  if (figure.dataset.mermaidState !== 'loading') return;
  const source = figure.querySelector<HTMLElement>('[data-mermaid-source]')?.textContent ?? '';
  const output = figure.querySelector<HTMLElement>('[data-mermaid-output]');
  if (!source.trim() || !output) {
    figure.dataset.mermaidState = 'error';
    return;
  }

  figure.dataset.mermaidState = 'rendering';
  try {
    const mermaid = await mermaidApi();
    const { svg } = await mermaid.render(`raven-mermaid-${diagramId++}`, source);
    if (!figure.isConnected) return;
    output.innerHTML = sanitizeSvg(svg);
    figure.dataset.mermaidState = 'ready';
  } catch {
    output.replaceChildren();
    figure.dataset.mermaidState = 'error';
  }
}

function activateManager(tab: HTMLButtonElement) {
  const widget = tab.closest<HTMLElement>('[data-installer]');
  const manager = tab.dataset.installerManager;
  if (!widget || !manager) return;
  widget.querySelectorAll<HTMLButtonElement>('[data-installer-manager]').forEach((button) => {
    const active = button === tab;
    button.setAttribute('aria-selected', String(active));
    button.tabIndex = active ? 0 : -1;
  });
  widget.querySelectorAll<HTMLElement>('[data-installer-panel]').forEach((panel) => {
    panel.hidden = panel.dataset.installerPanel !== manager;
  });
}

/** 서버가 안전한 정적 문서 마크업을 만들고, 이 컴포넌트는 필요한 동작만 위임한다.
    MutationObserver 덕분에 관리자 미리보기가 innerHTML을 교체해도 같은 경로로 활성화된다. */
export function MarkdownWidgets() {
  useEffect(() => {
    const scan = (root: ParentNode = document) => {
      root
        .querySelectorAll<HTMLElement>('[data-mermaid][data-mermaid-state="loading"]')
        .forEach((figure) => void renderDiagram(figure));
    };
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const tab = target.closest<HTMLButtonElement>('button[data-installer-manager]');
      if (tab) activateManager(tab);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLButtonElement) || !target.matches('[data-installer-manager]')) {
        return;
      }
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      const tabs = Array.from(
        target.closest('[role="tablist"]')?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ??
          [],
      );
      if (!tabs.length) return;
      event.preventDefault();
      const current = tabs.indexOf(target);
      const next =
        event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? tabs.length - 1
            : (current + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      activateManager(tabs[next]);
      tabs[next].focus();
    };
    const observer = new MutationObserver((records) => {
      records.forEach((record) =>
        record.addedNodes.forEach((node) => {
          if (node instanceof Element) {
            if (node.matches('[data-mermaid][data-mermaid-state="loading"]')) {
              void renderDiagram(node as HTMLElement);
            }
            scan(node);
          }
        }),
      );
    });

    scan();
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKeyDown);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKeyDown);
      observer.disconnect();
    };
  }, []);

  return null;
}
