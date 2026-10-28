'use client';

import { useEffect } from 'react';

let mermaidSequence = 0;
let configured = false;

const safeResource = (value: string) => {
  const compact = value.replace(/[\u0000-\u0020\u007f]+/g, '');
  if (compact.startsWith('//')) return false;
  if (compact.startsWith('#')) return true;
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(compact)?.[1]?.toLowerCase();
  return scheme === 'http' || scheme === 'https';
};

const hasUnsafeStyleResource = (value: string) => {
  if (/@import\b/i.test(value)) return true;
  for (const match of value.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/gi)) {
    const resource = match[2].replace(/[\u0000-\u0020\u007f]+/g, '');
    if (!/^#[a-z0-9_.:-]+$/i.test(resource)) return true;
  }
  return false;
};

/** Mermaid runs in strict mode; this second pass keeps executable SVG features out of the DOM. */
function safeSvg(svg: string) {
  const parsed = new DOMParser().parseFromString(svg, 'image/svg+xml');
  const root = parsed.documentElement;
  if (root.tagName.toLowerCase() !== 'svg' || parsed.querySelector('parsererror')) return null;

  for (const element of [root, ...Array.from(root.querySelectorAll('*'))]) {
    if (
      ['script', 'foreignobject', 'iframe', 'object', 'embed', 'audio', 'video', 'canvas'].includes(
        element.tagName.toLowerCase(),
      )
    ) {
      element.remove();
      continue;
    }
    if (element.tagName.toLowerCase() === 'style' && hasUnsafeStyleResource(element.textContent)) {
      element.remove();
      continue;
    }
    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      if (name.startsWith('on')) {
        element.removeAttribute(attribute.name);
        continue;
      }
      if (
        (name === 'style' || /url\(/i.test(attribute.value)) &&
        hasUnsafeStyleResource(attribute.value)
      ) {
        element.removeAttribute(attribute.name);
        continue;
      }
      if (['href', 'xlink:href', 'src'].includes(name) && !safeResource(attribute.value)) {
        element.removeAttribute(attribute.name);
      }
    }
  }
  return document.importNode(root, true);
}

export async function renderMermaidFigures(
  root: ParentNode,
  loadMermaid: () => Promise<typeof import('mermaid')> = () => import('mermaid'),
) {
  const figures = Array.from(
    root.querySelectorAll<HTMLElement>('[data-mermaid][data-mermaid-state="pending"]'),
  );
  if (root instanceof HTMLElement && root.matches('[data-mermaid][data-mermaid-state="pending"]')) {
    figures.unshift(root);
  }
  if (!figures.length) return;

  for (const figure of figures) figure.dataset.mermaidState = 'loading';

  let mermaid: (typeof import('mermaid'))['default'];
  try {
    ({ default: mermaid } = await loadMermaid());
  } catch {
    for (const figure of figures) showMermaidFallback(figure);
    return;
  }
  try {
    if (!configured) {
      const styles = getComputedStyle(document.documentElement);
      const token = (name: string) => styles.getPropertyValue(name).trim();
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        // The SVG sanitizer deliberately removes foreignObject. Ask Mermaid to
        // render labels as SVG text so nodes and edges retain their labels.
        htmlLabels: false,
        suppressErrorRendering: true,
        theme: 'base',
        themeVariables: {
          primaryColor: token('--d0-blue-light'),
          primaryTextColor: token('--d0-grey-900'),
          primaryBorderColor: token('--d0-grey-300'),
          lineColor: token('--d0-grey-600'),
          secondaryColor: token('--d0-grey-50'),
          tertiaryColor: token('--color-surface'),
          fontFamily: 'Pretendard Variable, Pretendard, sans-serif',
        },
      });
      configured = true;
    }
  } catch {
    for (const figure of figures) showMermaidFallback(figure);
    return;
  }

  await Promise.all(
    figures.map(async (figure) => {
      if (!figure.isConnected) return;
      const source = figure.querySelector<HTMLElement>('[data-mermaid-source]')?.textContent ?? '';
      const canvas = figure.querySelector<HTMLElement>('[data-mermaid-canvas]');
      const fallback = figure.querySelector<HTMLElement>('[data-mermaid-fallback]');
      const status = figure.querySelector<HTMLElement>('[data-mermaid-status]');
      if (!source.trim() || !canvas || !fallback) {
        showMermaidFallback(figure);
        return;
      }

      try {
        const id = `mermaid-diagram-${++mermaidSequence}`;
        const rendered = await mermaid.render(id, source);
        if (!figure.isConnected) return;
        const svg = safeSvg(rendered.svg);
        if (!svg) throw new Error('Unsafe Mermaid output');
        canvas.replaceChildren(svg);
        canvas.hidden = false;
        fallback.hidden = !figure.querySelector('[data-mermaid-source-toggle]');
        if (status) status.textContent = '';
        figure.dataset.mermaidState = 'ready';
      } catch {
        if (figure.isConnected) showMermaidFallback(figure);
      }
    }),
  );
}

function showMermaidFallback(figure: HTMLElement) {
  const canvas = figure.querySelector<HTMLElement>('[data-mermaid-canvas]');
  const fallback = figure.querySelector<HTMLElement>('[data-mermaid-fallback]');
  const status = figure.querySelector<HTMLElement>('[data-mermaid-status]');
  canvas?.replaceChildren();
  if (canvas) canvas.hidden = true;
  if (fallback) fallback.hidden = false;
  const sourceToggle = figure.querySelector<HTMLDetailsElement>('[data-mermaid-source-toggle]');
  if (sourceToggle) sourceToggle.open = true;
  if (status) status.textContent = '다이어그램을 표시할 수 없어 원문으로 보여 드려요.';
  figure.dataset.mermaidState = 'fallback';
}

function selectInstallerTab(tab: HTMLButtonElement, focus = false) {
  const installer = tab.closest<HTMLElement>('[data-installer]');
  const controls = tab.getAttribute('aria-controls');
  if (!installer || !controls) return;

  for (const candidate of installer.querySelectorAll<HTMLButtonElement>('[role="tab"]')) {
    const selected = candidate === tab;
    candidate.setAttribute('aria-selected', String(selected));
    candidate.tabIndex = selected ? 0 : -1;
  }
  for (const panel of installer.querySelectorAll<HTMLElement>('[role="tabpanel"]')) {
    panel.hidden = panel.id !== controls;
  }
  if (focus) tab.focus();
}

export const EMBED_HEIGHT_MESSAGE = 'raven:embed-height';
const EMBED_HEIGHT_RANGE = { min: 120, max: 6_000 };

/**
 * 임베드 문서가 알려 온 높이로 iframe을 맞춘다.
 *
 * sandbox에 allow-same-origin이 없어 event.origin은 항상 'null'이다. 그래서 출처 대신
 * 메시지를 보낸 창이 본문의 임베드 iframe인지를 확인한다 — 다른 창이 보낸 같은
 * 모양의 메시지로 본문 레이아웃을 흔들 수 없게.
 */
export function resizeEmbedFrame(event: MessageEvent, root: ParentNode = document) {
  const data: unknown = event.data;
  if (typeof data !== 'object' || data === null) return;
  const { type, height } = data as { type?: unknown; height?: unknown };
  if (type !== EMBED_HEIGHT_MESSAGE || typeof height !== 'number' || !Number.isFinite(height)) {
    return;
  }
  const frame = Array.from(
    root.querySelectorAll<HTMLIFrameElement>('[data-embed] iframe[data-embed-frame]'),
  ).find(
    (candidate) => candidate.contentWindow !== null && candidate.contentWindow === event.source,
  );
  if (!frame) return;
  const clamped = Math.min(EMBED_HEIGHT_RANGE.max, Math.max(EMBED_HEIGHT_RANGE.min, height));
  frame.height = String(Math.ceil(clamped));
}

export function ContentEnhancements({ contentKey = '' }: { contentKey?: string }) {
  useEffect(() => {
    const scrollable = new Set<HTMLElement>();
    const originalLabels = new WeakMap<HTMLElement, string | null>();
    const updateScrollable = (element: HTMLElement) => {
      const overflows = element.scrollWidth > element.clientWidth;
      if (overflows) {
        element.tabIndex = 0;
        element.dataset.horizontalScroll = '';
        element.setAttribute(
          'aria-label',
          element.tagName === 'TABLE'
            ? '가로로 스크롤할 수 있는 표'
            : element.matches('[data-filetree] > ul')
              ? '가로로 스크롤할 수 있는 파일 트리'
              : '가로로 스크롤할 수 있는 코드',
        );
      } else if (element.hasAttribute('data-horizontal-scroll')) {
        element.removeAttribute('tabindex');
        element.removeAttribute('data-horizontal-scroll');
        const originalLabel = originalLabels.get(element);
        if (originalLabel != null) element.setAttribute('aria-label', originalLabel);
        else element.removeAttribute('aria-label');
      }
    };
    const resizeObserver =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver((entries) => {
            for (const entry of entries) updateScrollable(entry.target as HTMLElement);
          });
    const registerScrollable = (root: ParentNode) => {
      for (const element of root.querySelectorAll<HTMLElement>(
        '[data-article-body] pre, [data-article-body] table, [data-article-body] [data-filetree] > ul',
      )) {
        if (scrollable.has(element)) continue;
        scrollable.add(element);
        originalLabels.set(element, element.getAttribute('aria-label'));
        updateScrollable(element);
        resizeObserver?.observe(element);
      }
    };
    registerScrollable(document);
    void renderMermaidFigures(document);

    const observer = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node instanceof HTMLElement) void renderMermaidFigures(node);
        }
      }
      registerScrollable(document);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const tab = target.closest<HTMLButtonElement>('[data-installer] [role="tab"]');
      if (tab) selectInstallerTab(tab);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        !(target instanceof HTMLButtonElement) ||
        !target.matches('[data-installer] [role="tab"]')
      ) {
        return;
      }
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      const tabs = Array.from(
        target.closest('[data-installer]')?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ??
          [],
      );
      const current = tabs.indexOf(target);
      if (current < 0) return;
      event.preventDefault();
      const next =
        event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? tabs.length - 1
            : (current + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      selectInstallerTab(tabs[next], true);
    };

    const onMessage = (event: MessageEvent) => resizeEmbedFrame(event);

    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('message', onMessage);
    return () => {
      observer.disconnect();
      resizeObserver?.disconnect();
      for (const element of scrollable) {
        if (!element.hasAttribute('data-horizontal-scroll')) continue;
        element.removeAttribute('tabindex');
        element.removeAttribute('data-horizontal-scroll');
        const originalLabel = originalLabels.get(element);
        if (originalLabel != null) element.setAttribute('aria-label', originalLabel);
        else element.removeAttribute('aria-label');
      }
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('message', onMessage);
    };
  }, [contentKey]);

  return null;
}
